import { RawConfig } from "../values";

type Reducer = (
  memo: RawConfig,
  key: string,
  i: number,
  coll: string[]
) => RawConfig;

export function set(path: string, value: any, obj: RawConfig) {
  const parts = path.split(".");

  const reducer: Reducer = (memo, key, i, coll) => {
    if (coll.length === 1) {
      return { ...memo, [key]: value };
    }

    if (i > 0) {
      return memo;
    }

    const v = memo[key];
    const init = v === undefined ? {} : v;

    return { ...memo, [key]: coll.slice(1).reduce(reducer, init) };
  };

  return parts.reduce(reducer, obj);
}
