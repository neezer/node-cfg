import { ISchema } from "./schema";

export type SchemaMap = Record<string, string | ISchema | object>;
export type RawConfig = Record<string, any>;
export type Errors = string[];

export const schemaMapCheck = (s: any): s is SchemaMap =>
  !!s && typeof s === "object" && !Array.isArray(s);
