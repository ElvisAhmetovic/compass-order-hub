import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isCompanyWeekend } from "./businessDays.ts";

Deno.test("Saturday 17 Oct 2026 11:00 Sarajevo is weekend", () => {
  assertEquals(isCompanyWeekend(new Date("2026-10-17T09:00:00Z")), true);
});
Deno.test("Sunday is weekend", () => {
  assertEquals(isCompanyWeekend(new Date("2026-10-18T12:00:00Z")), true);
});
Deno.test("Monday 19 Oct 2026 is a working day", () => {
  assertEquals(isCompanyWeekend(new Date("2026-10-19T07:00:00Z")), false);
});
Deno.test("Sunday 23:30 UTC is already Monday in Sarajevo", () => {
  assertEquals(isCompanyWeekend(new Date("2026-10-18T22:30:00Z")), false);
});
