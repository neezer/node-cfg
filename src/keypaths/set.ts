import { Config } from "..";

type Reducer = (memo: Config, key: string, i: number, coll: string[]) => Config;

export function set(path: string, value: any, obj: Config) {
  const parts = path.split(".");

  const reducer: Reducer = (memo, key, i, coll) => {
    if (coll.length === 1) {
      return { ...memo, [key]: value };
    }

    const v = memo[key];

    if (v !== undefined) {
      return { ...memo, [key]: coll.slice(1).reduce(reducer, v) };
    } else if (i === 0) {
      return { ...memo, [key]: coll.slice(1).reduce(reducer, {}) };
    }

    return memo;
  };

  return parts.reduce(reducer, obj);
}
