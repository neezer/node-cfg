#!/usr/bin/env node

// TODO convert to TS and export to bin

const fs = require("fs");
const path = require("path");
const distDir = path.join(__dirname, "../dist");
const requireDist = p => require(path.join(distDir, p));
const parentDir = process.argv[2];

const { load: loadFromPackage } = requireDist("./load/package-json");
const { load: loadFromConfig } = requireDist("./load/config-json");
const schemaMap = loadFromConfig(parentDir, loadFromPackage(parentDir));

const isCfgEntry = obj =>
  !!obj && "desc" in obj && "env" in obj && "format" in obj;

const getType = formatter => {
  switch (formatter) {
    case "number":
    case "port":
      return "number";
    case "boolean":
      return "boolean";
    default:
      if (Array.isArray(formatter)) {
        return formatter.map(v => `"${v}"`).join(" | ");
      }

      return "string";
  }
};

const findEntries = (keys, coll) =>
  keys.map(key => {
    const value = coll[key];

    if (key === "$appName") {
      return undefined;
    }

    if (isCfgEntry(value)) {
      return `${key}: ${getType(value.format)};`;
    }

    return `${key}: { ${findEntries(Object.keys(value), value)} };`;
  });

const entries = findEntries(Object.keys(schemaMap), schemaMap);

const Config = `export interface Config { ${entries
  .filter(v => !!v)
  .join(" ")} }`;

fs.writeFileSync(path.join(distDir, "config.d.ts"), Config);
