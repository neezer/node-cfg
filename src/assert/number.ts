import { Assert } from ".";

export const assert: Assert = (keyPath, value) => {
  const asNum = Number(value);

  if (!isNaN(asNum)) {
    return [null, asNum];
  } else {
    return [`"${keyPath}" cannot be cast to a number`, false];
  }
};
