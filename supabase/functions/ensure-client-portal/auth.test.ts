import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const URL_ = `${Deno.env.get("SUPABASE_URL") ?? "https://fjybmlugiqmiggsdrkiq.supabase.co"}/functions/v1/ensure-client-portal`;

Deno.test("rejects request without token (401)", async () => {
  const r = await fetch(URL_, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "x@example.com" }) });
  await r.text();
  assertEquals(r.status, 401);
});
Deno.test("rejects bogus token (401)", async () => {
  const r = await fetch(URL_, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer bogus" }, body: JSON.stringify({ email: "x@example.com" }) });
  await r.text();
  assertEquals(r.status, 401);
});
