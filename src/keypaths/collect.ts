import { Schema, schemaCheck } from "../schema";

const objCheck = (o: any): o is Record<string, any> =>
  !!o && typeof o === "object" && !Array.isArray(o);

export function collect(
  obj: Record<string, unknown> | Schema,
  prefix: string | null = null
): string[] {
  const prefixFn = (k: string) => [prefix, k].filter(v => !!v).join(".");

  let keysToKeep: string[] = [];

  for (const key of Object.keys(obj)) {
    const value = obj[key];

    if (schemaCheck(value)) {
      keysToKeep.push(prefixFn(key));
    } else if (objCheck(value)) {
      keysToKeep = keysToKeep.concat(collect(value, prefixFn(key)));
    }
  }

  return keysToKeep;
}
