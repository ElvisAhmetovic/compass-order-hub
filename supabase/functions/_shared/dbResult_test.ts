import { assertEquals, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { must } from "./dbResult.ts";

Deno.test("must throws when the query failed instead of returning an empty list", () => {
  assertThrows(() => must({ data: null, error: { message: "permission denied" } }), Error, "permission denied");
});

Deno.test("must returns rows on success and [] for no rows", () => {
  assertEquals(must({ data: [{ id: "a" }], error: null }), [{ id: "a" }]);
  assertEquals(must({ data: null, error: null }), []);
});
