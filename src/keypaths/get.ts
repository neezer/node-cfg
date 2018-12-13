// NOTE does not support array indexes
export function get(
  keyPath: string | string[],
  obj: Record<string, any> | undefined
): any {
  if (obj === undefined) {
    return obj;
  } else if (typeof keyPath === "string") {
    const parts = keyPath.split(".");

    return get(parts, obj);
  } else if (keyPath.length === 0) {
    return obj;
  } else if (keyPath.length === 1) {
    return obj[keyPath[0]];
  } else {
    const parts = [...keyPath];
    const leftKey = parts.shift();

    if (leftKey !== undefined) {
      const value = obj[leftKey];

      return get(parts, value);
    } else {
      return obj;
    }
  }
}
