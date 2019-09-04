import fs from "fs";
import path from "path";
import { extend } from "../utils";
import { SchemaMap, schemaMapCheck } from "../values";

export function load(
  existingSchemaMap: SchemaMap = {},
  testMode: boolean = false,
  schemaPath?: string
): SchemaMap | undefined {
  try {
    const configJsonPath =
      schemaPath ||
      path.join(process.cwd(), testMode ? "config.test.json" : "config.json");

    const rawSchema = fs.readFileSync(configJsonPath, {
      encoding: "utf-8"
    });

    const parsedSchema = JSON.parse(rawSchema);

    if (schemaMapCheck(parsedSchema)) {
      return extend(true, existingSchemaMap || {}, parsedSchema);
    }
  } catch (error) {
    if (existingSchemaMap !== undefined) {
      return existingSchemaMap;
    }

    throw new Error(`cannot read ${schemaPath}`);
  }
}
