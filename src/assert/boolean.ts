import { Assert } from ".";

export const assert: Assert = (keyPath, value) => {
  const valueAsString = String(value).toLowerCase();

  if (value === true || value === false) {
    return [null, value];
  } else if (
    valueAsString === "true" ||
    valueAsString === "t" ||
    valueAsString === "1"
  ) {
    return [null, true];
  } else if (
    valueAsString === "false" ||
    valueAsString === "f" ||
    valueAsString === "0" ||
    value === undefined
  ) {
    return [null, false];
  } else {
    return [`"${keyPath}" is not truthy or falsy`, false];
  }
};
