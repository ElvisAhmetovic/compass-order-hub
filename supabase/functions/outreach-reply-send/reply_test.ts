import { assertEquals } from "jsr:@std/assert@1";
const URL_ = `${Deno.env.get("SUPABASE_URL") ?? "https://fjybmlugiqmiggsdrkiq.supabase.co"}/functions/v1/outreach-reply-send`;
Deno.test("no session gets 401", async () => {
  const r = await fetch(URL_, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  await r.text(); assertEquals(r.status, 401);
});
Deno.test("bogus token gets 401", async () => {
  const r = await fetch(URL_, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer x.y.z" }, body: "{}" });
  await r.text(); assertEquals(r.status, 401);
});
