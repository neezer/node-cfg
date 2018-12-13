import { Assert } from ".";

export const assert: Assert = (keyPath, value) => {
  const asNum = Number(value);

  const isValid =
    !isNaN(asNum) && asNum % 1 === 0 && asNum <= 65535 && asNum >= 1;

  if (isValid) {
    return [null, asNum];
  } else {
    return [`"${keyPath}" is not a valid port`, false];
  }
};
