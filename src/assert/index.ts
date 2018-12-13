import { Format } from "../schema";

export { assert as present } from "./present";
export { assert as boolean } from "./boolean";
export { assert as port } from "./port";
export { assert as number } from "./number";
export { assert as in } from "./in";

export type Assert = (
  keyPath: string,
  value: any,
  format?: Format
) => [string | null, any];
