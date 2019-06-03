import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import toml from "toml";
import * as keypaths from "./keypaths";
import { ISchema } from "./schema";
import { validate } from "./validate";

export type Config = Record<string, any>;
export type DefinitelyErrors = string[];
export type Errors = DefinitelyErrors | null;
export type SchemaMap = Record<string, string | ISchema | object>;
export type IntermediateResult = [DefinitelyErrors, Config];
export type Result<T> = [Errors, T];
type Reducer = (memo: IntermediateResult, p: string) => IntermediateResult;
type TypeCheck<T> = (v: any) => T;

const identity = (v: any) => v;

const schemaMapCheck = (s: any): s is SchemaMap =>
  !!s && typeof s === "object" && !Array.isArray(s);

interface IArgs<T> {
  check?: TypeCheck<T>;
  schema?: SchemaMap;
}

export function cfg<T = any>({
  check = identity,
  schema
}: IArgs<T>): Result<T> {
  const configJsonPath = path.join(process.cwd(), "config.json");
  let schemaMap: SchemaMap | undefined = {};

  if (schema === undefined) {
    schemaMap = loadConfigFromPackage();

    if (fs.existsSync(configJsonPath)) {
      schemaMap = loadConfigJson(schemaMap || {});
    }
  } else {
    schemaMap = schema;
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
    const updated: Config = keypaths.set(p, value, conf);
    const schema = keypaths.get(p, schemaMap);
    const [newErrs, coercedValue] = validate(updated, p, value, schema);
    const validated: Config = keypaths.set(p, coercedValue, conf);

    return [errs.concat(newErrs), validated];
  };

  const [errors, config] = paths.reduce(reducer, [[], {}]);

  return [errors.length === 0 ? null : errors, check(config)];
}

function buildEnvMap(schemaMap: SchemaMap, paths: string[]): Config {
  return paths.reduce((memo, p) => {
    const { env } = keypaths.get(p, schemaMap);
    const value = process.env[env];

    return { ...memo, [p]: value };
  }, {});
}

function loadConfigJson(existingSchemaMap: SchemaMap): SchemaMap | undefined {
  try {
    const schemaPath = path.join(process.cwd(), "config.json");
    const rawSchema = fs.readFileSync(schemaPath, { encoding: "utf-8" });
    const parsedSchema = JSON.parse(rawSchema);

    if (schemaMapCheck(parsedSchema)) {
      return extend(true, existingSchemaMap, parsedSchema);
    }
  } catch (error) {
    throw new Error("cannot read config.json");
  }
}

function loadConfigFromPackage(): SchemaMap | undefined {
  const packageJsonRaw = fs.readFileSync(
    path.join(process.cwd(), "package.json"),
    { encoding: "utf-8" }
  );

  const packageJson = JSON.parse(packageJsonRaw);
  const config = packageJson.config;

  if (!!config && schemaMapCheck(config.cfg)) {
    return config.cfg;
  }
}

// https://specifications.freedesktop.org/basedir-spec/basedir-spec-latest.html
function buildXDGConfigMap(schemaMap: SchemaMap, paths: string[]): Config {
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

// http://gomakethings.com/merging-objects-with-vanilla-javascript/
// NOTE: original script had lots of typos; fixed here
function extend(...args: any[]) {
  const extended: Record<string, any> = {};

  let deep = false;
  let i = 0;

  if (typeof args[0] === "boolean") {
    deep = args[0];
    i++;
  }

  const merge = (obj: any) => {
    for (const prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        const shouldRecurse =
          deep &&
          Object.prototype.toString.call(obj[prop]) === "[object Object]";

        extended[prop] = shouldRecurse
          ? extend(true, extended[prop], obj[prop])
          : obj[prop];
      }
    }
  };

  for (; i < args.length; i++) {
    merge(args[i]);
  }

  return extended;
}
