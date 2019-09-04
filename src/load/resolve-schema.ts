import makeDebug from "debug";
import { extend } from "../utils";
import { SchemaMap } from "../values";

const debug = makeDebug("cfg:resolve-schema");

export function resolveSchema(opts: ResolveSchemaOpts) {
  const { testMode, givenSchema, fileSchema } = opts;

  if (!testMode && givenSchema === undefined) {
    debug("no schema provided");
    debug("reading schema from package.json");

    return fileSchema;
  } else if (testMode) {
    return extend(fileSchema, givenSchema);
  } else {
    debug("schema provided");

    return givenSchema;
  }
}

interface ResolveSchemaOpts {
  fileSchema?: SchemaMap;
  givenSchema?: SchemaMap;
  testMode?: boolean;
}
