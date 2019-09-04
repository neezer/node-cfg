import fs from "fs";
import { extend } from "../utils";
import { SchemaMap, schemaMapCheck } from "../values";

export function load(
  schemaPath: string,
  existingSchemaMap: SchemaMap = {}
): SchemaMap | undefined {
  try {
    const rawSchema = fs.readFileSync(schemaPath, { encoding: "utf-8" });
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
