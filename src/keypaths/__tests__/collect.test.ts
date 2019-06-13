import { collect } from "..";
import { Schema } from "../../schema";

const schema: Schema = {
  desc: "whatever",
  env: "whatever",
  format: "string"
};

test("return for simple object", () => {
  const obj = { a: schema, b: 2, c: schema };
  const paths = collect(obj);

  expect(paths.sort()).toEqual(["a", "c"].sort());
});

test("return for deep object", () => {
  const obj = { a: schema, b: { d: schema, e: { f: { g: schema } } }, c: 3 };
  const paths = collect(obj);

  expect(paths.sort()).toEqual(["a", "b.d", "b.e.f.g"].sort());
});
