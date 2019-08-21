import { set } from "..";

test("sets key one level deep", () => {
  const obj = { a: "hello" };
  const result = set("a", "goodbye", obj);

  expect(result.a).toBe("goodbye");
  expect(result).not.toBe(obj);
});

test("sets key many levels deep", () => {
  const obj = { a: "hello", b: { c: 4, d: { target: "missed" } } };
  const result = set("b.d.target", "hit", obj);

  expect(result).not.toBe(obj);
  expect(result).toEqual(
    expect.objectContaining({
      a: "hello",
      b: {
        c: 4,
        d: {
          target: "hit"
        }
      }
    })
  );
});

test("works on empty objects", () => {
  const obj = {};
  const result = set("b.d.target", "hit", {});

  expect(result).not.toBe(obj);
  expect(result).toEqual(
    expect.objectContaining({
      b: {
        d: {
          target: "hit"
        }
      }
    })
  );
});

test("does not collide for similar key paths", () => {
  const val1 = Object.create(null);
  const val2 = Object.create(null);
  const initialResult = set("b.c", val2, {});
  const compoundResult = set("a.b.c", val1, initialResult);

  expect(compoundResult).toEqual({ a: { b: { c: val1 } }, b: { c: val2 } });
});
