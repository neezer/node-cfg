import fs from "fs";
import path from "path";
import { extend } from "../utils";
import { SchemaMap, schemaMapCheck } from "../values";

export function load(
  cwd = process.cwd(),
  existingSchemaMap?: SchemaMap
): SchemaMap | undefined {
  try {
    const schemaPath = path.join(cwd, "config.json");
    const rawSchema = fs.readFileSync(schemaPath, { encoding: "utf-8" });
    const parsedSchema = JSON.parse(rawSchema);

    if (schemaMapCheck(parsedSchema)) {
      return extend(true, existingSchemaMap || {}, parsedSchema);
    }
  } catch (error) {
    if (existingSchemaMap !== undefined) {
      return existingSchemaMap
    }

    throw new Error("cannot read config.json");
  }
}

