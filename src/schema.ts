export type Format = string[] | string;

export interface Schema {
  $appName?: string;
  env: string;
  desc: string;
  optional?: boolean;
  format: Format;
  requiredWhen?: string;
  caseInsensitive?: boolean;
  [key: string]: string | boolean | Format | undefined;
}

export const schemaCheck = (s: any): s is Schema =>
  !!s &&
  typeof s === "object" &&
  !Array.isArray(s) &&
  "env" in s &&
  "desc" in s &&
  "format" in s;
