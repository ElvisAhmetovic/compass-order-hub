import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildStripeButton } from "./stripeButton.ts";

Deno.test("https link gives a button with the link and label", () => {
  const h = buildStripeButton("https://buy.stripe.com/test_ABC", "Jetzt online bezahlen mit Stripe");
  assert(h.includes('href="https://buy.stripe.com/test_ABC"'));
  assert(h.includes(">Jetzt online bezahlen mit Stripe</a>"));
});
Deno.test("no button for missing, http or javascript links", () => {
  for (const l of [undefined, "", "http://buy.stripe.com/x", "javascript:alert(1)", "not a url"]) assertEquals(buildStripeButton(l, "x"), "");
});
Deno.test("odd characters are escaped", () => {
  const h = buildStripeButton('https://buy.stripe.com/a?x="><script>', "<b>pay</b>");
  assert(!h.includes("<script>") && !h.includes("<b>"));
});
