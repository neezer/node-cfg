import { AssembleFrom, Format } from "../schema";

export { assert as boolean } from "./boolean";
export { assert as in } from "./in";
export { assert as number } from "./number";
export { assert as path } from "./path";
export { assert as port } from "./port";
export { assert as present } from "./present";
export { assert as url } from "./url";

interface Optional {
  assembleFrom?: AssembleFrom;
  caseInsensitive?: boolean;
}

export type Assert = (
  keyPath: string,
  value: any,
  format?: Format,
  optional?: Optional
) => [string | null, any];
