import makeDebug from "debug";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import toml from "toml";
import * as keypaths from "./keypaths";
import { load as loadFromConfig } from "./load/config-json";
import { load as loadFromPackage } from "./load/package-json";
import { resolveSchema } from "./load/resolve-schema";
import { Schema } from "./schema";
import { validate } from "./validate";
import { Errors, RawConfig, SchemaMap, Warnings } from "./values";

const debug = makeDebug("cfg");

type ErrorMap = Record<string, string[]>;
type IntermediateResult = [Errors, Warnings, RawConfig, ErrorMap];
type Reducer = (memo: IntermediateResult, p: string) => IntermediateResult;
type CFGFn = <T = RawConfig>(props: IProps | undefined) => T;
type CFG = CFGFn & { test: CFGFn };

interface IProps {
  schema?: SchemaMap;
  onError?: (errors: Errors) => void;
  onWarning?: (warnings: Warnings) => void;
  testMode?: boolean;
  configPath?: string;
  testConfigPath?: string;
}

function cfg<T = RawConfig>(props: IProps = { testMode: false }) {
  const {
    schema: givenSchema,
    onError = defaultErrorHandler,
    onWarning = defaultWarningHandler,
    testMode,
    configPath
  } = props;

  const packageSchema = loadFromPackage();
  const fileSchema = loadFromConfig(packageSchema || {}, false, configPath);

  const schemaMap: SchemaMap | undefined = resolveSchema({
    fileSchema,
    givenSchema,
    testMode
  });

  if (schemaMap === undefined) {
    throw new Error("schema is unknown");
  }

  debug("reading environment variables");

  dotenv.config();

  const paths = keypaths.collect(schemaMap);
  const xdgConfigMap = buildXDGConfigMap(schemaMap, paths);
  const envMap = buildEnvMap(schemaMap, paths);

  const reducer: Reducer = ([errs, warns, conf, errMap], p) => {
    const configValue = xdgConfigMap[p];
    const envValue = envMap[p];
    const value = configValue === undefined ? envValue : configValue;
    const updated = keypaths.set(p, value, conf);
    const schema = keypaths.get(p, schemaMap) as Schema;

    const [newErrs, newWarns, coercedValue] = validate(
      updated,
      p,
      value,
      schema
    );

    const validated = keypaths.set(p, coercedValue, conf);
    const hasErrors = newErrs.length > 0;
    const errEntry = { [p]: newErrs };

    return [
      errs.concat(newErrs),
      warns.concat(newWarns),
      validated,
      hasErrors ? { ...errMap, ...errEntry } : errMap
    ];
  };

  const [errors, warnings, config, errorMap] = paths.reduce(reducer, [
    [],
    [],
    {},
    {}
  ]);

  if (testMode) {
    return new Proxy(config, {
      get: (obj, prop: string) => {
        const keysWithErrors = Object.keys(errorMap);

        if (keysWithErrors.includes(prop)) {
          throw new Error(errorMap[prop][0]);
        }

        return obj[prop];
      }
    }) as T;
  }

  if (errors.length > 0) {
    debug("has errors");

    onError(errors);
  }

  if (warnings.length > 0) {
    debug("has warnings");

    onWarning(warnings);
  }

  return config as T;
}

Object.defineProperty(cfg, "test", {
  value: <T = RawConfig>(props: IProps = { testMode: true }) => {
    const { schema: givenSchema, testMode, testConfigPath } = props;
    const packageSchema = loadFromPackage();

    const fileSchema = loadFromConfig(
      packageSchema || {},
      true,
      testConfigPath
    );

    const schemaMap: SchemaMap | undefined = resolveSchema({
      fileSchema,
      givenSchema,
      testMode
    });

    return cfg<T>({ ...props, schema: schemaMap, testMode: true });
  }
});

const typedCfg = cfg as CFG;

export { typedCfg as cfg };

function buildEnvMap(schemaMap: SchemaMap, paths: string[]): RawConfig {
  return paths.reduce((memo, p) => {
    const { env } = keypaths.get(p, schemaMap);
    const value = process.env[env];

    return { ...memo, [p]: value };
  }, {});
}

// https://specifications.freedesktop.org/basedir-spec/basedir-spec-latest.html
function buildXDGConfigMap(schemaMap: SchemaMap, paths: string[]): RawConfig {
  const appName = schemaMap.$appName;

  if (typeof appName === "string") {
    const XDG_CONFIG_HOME = process.env.XDG_CONFIG_HOME;
    const HOME = process.env.HOME;

    let dirPath = null;

    if (XDG_CONFIG_HOME !== undefined) {
      debug("using XDG_CONFIG_HOME");

      dirPath = path.join(XDG_CONFIG_HOME, appName);
    } else if (HOME !== undefined) {
      debug("using HOME/.config");

      dirPath = path.join(HOME, ".config", appName);
    }

    if (dirPath === null) {
      debug("no XDG config found; skipping");

      return {};
    }

    const filePath = path.join(dirPath, "env.toml");

    try {
      const rawToml = fs.readFileSync(filePath, { encoding: "utf-8" });
      const xdgConfig = toml.parse(rawToml);

      return paths.reduce((memo, p) => {
        const value = keypaths.get(p, xdgConfig);

        return { ...memo, [p]: value };
      }, {});
    } catch (error) {
      debug(error);
    }
  }

  return {};
}

function defaultErrorHandler(errors: Errors) {
  errors.forEach(error => {
    process.stderr.write(`config error: ${error}\n`);
  });

  process.exit(1);
}

function defaultWarningHandler(warnings: Warnings) {
  warnings.forEach(warning => {
    process.stdout.write(`config warning: ${warning}\n`);
  });
}
