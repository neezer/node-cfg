import test, { Test } from "tape";
import { collect } from "../../src/keypaths";
import { ISchema } from "../../src/schema";

const schema: ISchema = {
  desc: "whatever",
  env: "whatever",
  format: "string"
};

test("return for simple object", (t: Test) => {
  t.plan(1);

  const obj = { a: schema, b: 2, c: schema };
  const paths = collect(obj);

  t.deepEqual(paths.sort(), ["a", "c"].sort(), "paths are correct");
});

test("return for deep object", (t: Test) => {
  t.plan(1);

  const obj = { a: schema, b: { d: schema, e: { f: { g: schema } } }, c: 3 };
  const paths = collect(obj);

  t.deepEqual(
    paths.sort(),
    ["a", "b.d", "b.e.f.g"].sort(),
    "paths are correct"
  );
});
