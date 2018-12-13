export type Format = string[] | string;

export interface ISchema {
  $appName?: string;
  env: string;
  desc: string;
  optional?: boolean;
  format: Format;
  requiredWhen?: string;
  [key: string]: string | boolean | Format | undefined;
}

export const schemaCheck = (s: any): s is ISchema =>
  !!s &&
  typeof s === "object" &&
  !Array.isArray(s) &&
  "env" in s &&
  "desc" in s &&
  "format" in s;
