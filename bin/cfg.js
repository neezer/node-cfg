#!/usr/bin/env node

// TODO convert to TS and export to bin
// TODO maybe do better error handling?

const fs = require("fs");
const path = require("path");
const distDir = path.join(__dirname, "../dist");
const requireDist = p => require(path.join(distDir, p));
const parentDir = process.argv[2];

try {
  const { load: loadFromPackage } = requireDist("./load/package-json");
  const { load: loadFromConfig } = requireDist("./load/config-json");

  const schemaMap = loadFromConfig(parentDir, loadFromPackage(parentDir));

  const isCfgEntry = obj =>
    !!obj && "desc" in obj && "env" in obj && "format" in obj;

  const getType = value => {
    const { optional, requiredWhen } = value;
    const possiblyOptional = optional === true || requiredWhen !== undefined;
    const retValue = type => (possiblyOptional ? `${type} | undefined` : type);

    switch (value.format) {
      case "number":
      case "port":
        return retValue("number");
      case "boolean":
        return retValue("boolean");
      case "url":
        return retValue("URL");
      default:
        if (Array.isArray(value.format)) {
          if (possiblyOptional) {
            return mapValues([...value.format, "undefined"]);
          }

          return mapValues(value.format);
        }

        return retValue("string");
    }
  };

  const findEntries = (keys, coll) =>
    keys.map(key => {
      const value = coll[key];

      if (key === "$appName") {
        return undefined;
      }

      if (isCfgEntry(value)) {
        return `${key}: ${getType(value)};`;
      }

      return `${key}: { ${findEntries(Object.keys(value), value).join(" ")} };`;
    });

  const entries = findEntries(Object.keys(schemaMap), schemaMap);

  const Config = `/// <reference types="node" />

export interface Config { ${entries.filter(v => !!v).join(" ")} }`;

  fs.writeFileSync(path.join(distDir, "config.d.ts"), Config);
} catch (error) {
  // silently ignore error
}

function mapValues(values) {
  return values.map(v => `"${v}"`).join(" | ");
}
