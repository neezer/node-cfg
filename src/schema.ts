export type Format = string[] | string;

export interface AssembleFrom {
  host: string;
  protocol: string;
  port?: string;
  search?: string;
  username?: string;
  password?: string;
  pathname?: string;
  [key: string]: string | undefined;
}

export interface Schema {
  $appName?: string;
  env: string;
  desc: string;
  optional?: boolean;
  format: Format;
  requiredWhen?: string;
  caseInsensitive?: boolean;
  assembleFrom?: AssembleFrom;
  [key: string]: string | boolean | Format | AssembleFrom | undefined;
}

export const schemaCheck = (s: any): s is Schema =>
  !!s &&
  typeof s === "object" &&
  !Array.isArray(s) &&
  "env" in s &&
  "desc" in s &&
  "format" in s;
