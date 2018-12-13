import { Assert } from ".";

export const assert: Assert = (keyPath, value) => {
  if (value === true || value === false) {
    return [null, value];
  } else if (value === "true" || value === "t" || value === "1") {
    return [null, true];
  } else if (
    value === "false" ||
    value === "f" ||
    value === "0" ||
    value === undefined
  ) {
    return [null, false];
  } else {
    return [`"${keyPath}" is not truthy or falsy`, false];
  }
};
