import { Schema } from "./schema";

export type SchemaMap = Record<string, string | Schema | object>;
export type RawConfig = Record<string, any>;
export type Errors = string[];
export type Warnings = string[];

export const schemaMapCheck = (s: any): s is SchemaMap =>
  !!s && typeof s === "object" && !Array.isArray(s);
