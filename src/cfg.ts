import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import toml from "toml";
import * as keypaths from "./keypaths";
import { load as loadFromConfig } from "./load/config-json";
import { load as loadFromPackage } from "./load/package-json";
import { ISchema } from "./schema";
import { validate } from "./validate";
import { DefinitelyErrors, RawConfig, SchemaMap } from "./values";

type Errors = DefinitelyErrors | null;
type IntermediateResult = [DefinitelyErrors, RawConfig];
type Result<T> = [Errors, T];
type Reducer = (memo: IntermediateResult, p: string) => IntermediateResult;

interface IArgs {
  schema?: SchemaMap;
}

export function cfg<T>({ schema: givenSchema }: IArgs = {}): Result<T> {
  const configJsonPath = path.join(process.cwd(), "config.json");
  let schemaMap: SchemaMap | undefined = {};

  if (givenSchema === undefined) {
    schemaMap = loadFromPackage();

    if (fs.existsSync(configJsonPath)) {
      schemaMap = loadFromConfig(process.cwd(), schemaMap || {});
    }
  } else {
    schemaMap = givenSchema;
  }

  if (schemaMap === undefined) {
    throw new Error("schema is unknown");
  }

  dotenv.config();

  const paths = keypaths.collect(schemaMap);
  const xdgConfigMap = buildXDGConfigMap(schemaMap, paths);
  const envMap = buildEnvMap(schemaMap, paths);

  const reducer: Reducer = ([errs, conf], p) => {
    const configValue = xdgConfigMap[p];
    const envValue = envMap[p];
    const value = configValue || envValue;
    const updated = keypaths.set(p, value, conf);
    const schema = keypaths.get(p, schemaMap) as ISchema;
    const [newErrs, coercedValue] = validate(updated, p, value, schema);
    const validated = keypaths.set(p, coercedValue, conf);

    return [errs.concat(newErrs), validated];
  };

  const [errors, config] = paths.reduce(reducer, [[], {}]);

  return [errors.length === 0 ? null : errors, config as T];
}

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
      dirPath = path.join(XDG_CONFIG_HOME, appName);
    } else if (HOME !== undefined) {
      dirPath = path.join(HOME, ".config", appName);
    }

    if (dirPath === null) {
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
      // do nothing
    }
  }

  return {};
}