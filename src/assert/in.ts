import { Assert } from ".";

export const assert: Assert = (keyPath, value, format) => {
  let err = null;

  if (Array.isArray(format)) {
    const found = format.indexOf(value) !== -1;

    if (!found) {
      err = `${keyPath} => "${value}" is not in "${format}"`;
    }

    return [err, value];
  }

  err = `${format} is not an array`;

  return [err, value];
};
