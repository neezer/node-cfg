import { Config, DefinitelyErrors } from ".";
import * as assert from "./assert";
import * as keypaths from "./keypaths";
import { ISchema } from "./schema";

type CoercedValue = any;

export function validate(
  config: Config,
  keyPath: string,
  value: any,
  schema: ISchema
): [DefinitelyErrors, CoercedValue] {
  const { format, optional, requiredWhen, caseInsensitive } = schema;
  const errors: DefinitelyErrors = [];

  let foreignRequirementTrue = true;
  let err = null;
  let val;

  if (requiredWhen !== undefined) {
    const [, foreignRequirement] = assert.boolean(
      requiredWhen,
      keypaths.get(requiredWhen, config)
    );

    if (foreignRequirement === false) {
      foreignRequirementTrue = false;
    }
  }

  const isRequired = optional !== true && foreignRequirementTrue;

  if (isRequired) {
    [err, val] = assert.present(keyPath, value);
  }

  if (isRequired && Array.isArray(format)) {
    [err, val] = assert.in(keyPath, value, format, caseInsensitive);
  } else {
    switch (format) {
      case "boolean":
        [err, val] = assert.boolean(keyPath, value);
        break;
      case "port":
        [err, val] = assert.port(keyPath, value);
        break;
      case "number":
        [err, val] = assert.number(keyPath, value);
        break;
      default:
        val = value;
    }
  }

  if (err !== null) {
    errors.push(err);
  }

  return [errors, val];
}
