import test, { Test } from "tape";
import { set } from "../../src/keypaths";

test("sets key one level deep", (t: Test) => {
  t.plan(2);

  const obj = { a: "hello" };
  const result = set("a", "goodbye", obj);

  t.equal(result.a, "goodbye", "a is updated");
  t.notEqual(result, obj, "object is new");
});

test("sets key many levels deep", (t: Test) => {
  t.plan(4);

  const obj = { a: "hello", b: { c: 4, d: { target: "missed" } } };
  const result = set("b.d.target", "hit", obj);

  t.notEqual(result, obj, "object is new");
  t.equal(result.a, "hello", "a is correct");
  t.equal(result.b.c, 4, "other value is correct");
  t.equal(result.b.d.target, "hit", "deep value is updated");
});

test("works on empty objects", (t: Test) => {
  t.plan(2);

  const obj = {};
  const result = set("b.d.target", "hit", {});

  t.notEqual(result, obj, "object is new");
  t.equal(result.b.d.target, "hit", "deep value is updated");
});
