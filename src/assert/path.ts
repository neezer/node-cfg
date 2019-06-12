import fs from "fs";
import { Assert } from ".";

export const assert: Assert = (_, value) => {
  const exists = fs.existsSync(value);

  if (exists) {
    return [null, value];
  }

  return [`no file present at ${value}`, false];
};
