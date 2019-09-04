#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const distDir = path.join(__dirname, "../dist");
const requireDist = p => require(path.join(distDir, p));
const parentDir = process.argv[2] || process.cwd();

let debug = () => {
	// nothing
};

try {
	debug = require("debug")("cfg");
} catch (_) {
	// nothing
}

try {
	const { load: loadFromPackage } = requireDist("./load/package-json");
	const { load: loadFromConfig } = requireDist("./load/config-json");
	const schemaPath = path.join(parentDir, "config.json");
	const testSchemaPath = path.join(parentDir, "config.test.json");

	const schemaMap = loadFromConfig(
		loadFromPackage(parentDir, false),
		false,
		schemaPath
	);

	const testSchemaMap = loadFromConfig(
		loadFromPackage(parentDir, true),
		true,
		schemaPath
	);

	const isCfgEntry = obj =>
		!!obj && "desc" in obj && "env" in obj && "format" in obj;

	const getType = format => {
		switch (format) {
			case "number":
			case "port":
				return "number";
			case "boolean":
				return "boolean";
			case "url":
				return "URL";
			case "path":
				return "string | Buffer";
			default:
				if (Array.isArray(format)) {
					return mapValues(format);
				}

				return "string";
		}
	};

	const findEntries = (keys, coll) =>
		keys.map(key => {
			const value = coll[key];

			const possiblyOptional =
				value.optional === true || value.requiredWhen !== undefined;

			if (key === "$appName") {
				return undefined;
			}

			if (isCfgEntry(value)) {
				return `${key}${possiblyOptional ? "?" : ""}: ${getType(
					value.format
				)};`;
			}

			return `${key}: { ${findEntries(Object.keys(value), value).join(
				" "
			)} };`;
		});

	const entries = findEntries(Object.keys(schemaMap), schemaMap);
	const testEntries = findEntries(Object.keys(testSchemaMap), testSchemaMap);

	const Config = `/// <reference types="node" />

export interface Config { ${entries.filter(v => !!v).join(" ")} }`;

	const TestConfig = `/// <reference types="node" />

export interface TestConfig { ${testEntries.filter(v => !!v).join(" ")} }`;

	fs.writeFileSync(path.join(distDir, "config.d.ts"), Config);
	debug("config.d.ts written");
	fs.writeFileSync(path.join(distDir, "config.test.d.ts"), TestConfig);
	debug("config.test.d.ts written");
} catch (error) {
	debug(error);
}

function mapValues(values) {
	return values.map(v => `"${v}"`).join(" | ");
}
