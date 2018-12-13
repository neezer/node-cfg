import { Assert } from ".";

export const assert: Assert = (keyPath, value) => {
  if (value === undefined) {
    return [`value at "${keyPath}" cannot be undefined`, undefined];
  }

  return [null, value];
};
