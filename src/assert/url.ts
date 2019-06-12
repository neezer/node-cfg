import { Assert } from ".";

export const assert: Assert = (keyPath, value) => {
  try {
    const parsed = new URL(value);

    return [null, parsed];
  } catch (_) {
    return [`"${keyPath}" cannot be cast to a URL`, false];
  }
};
