import fs from "fs";
import { Assert } from ".";

export const assert: Assert = (keyPath, value) => {
  const exists = fs.existsSync(value);

  if (exists) {
    return [null, value];
  }

  if (value === undefined) {
    return [`for ${keyPath}, value is undefined`, false];
  }

  return [`for ${keyPath}, no file present at ${value}`, false];
};
