import fs from "fs";
import path from "path";
import { SchemaMap, schemaMapCheck } from "../values";

export function load(
  cwd = process.cwd(),
  testMode: boolean = false
): SchemaMap | undefined {
  const packageJsonRaw = fs.readFileSync(path.join(cwd, "package.json"), {
    encoding: "utf-8"
  });

  const packageJson = JSON.parse(packageJsonRaw);
  const config = testMode ? packageJson.configTest : packageJson.config;

  if (!!config && schemaMapCheck(config.cfg)) {
    return config.cfg;
  }
}
