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
