import { assertEquals } from "jsr:@std/assert@1";
import { factRejectReason, knowledgeBlock, normalizeTopic } from "../_shared/assistantKnowledgeRules.ts";

Deno.test("Given a normal business fact, When checked, Then it may be saved", () => {
  assertEquals(factRejectReason("Complaint status means the client is unhappy and we call them within 24h."), null);
});
Deno.test("Given a password, When checked, Then it is refused", () => {
  assertEquals(typeof factRejectReason("The portal password is Abc12345"), "string");
});
Deno.test("Given an IBAN or card number, When checked, Then it is refused", () => {
  assertEquals(typeof factRejectReason("Bank DE89 3704 0044 0532 0130 00 is ours"), "string");
  assertEquals(typeof factRejectReason("Card 4111 1111 1111 1111"), "string");
});
Deno.test("Given an overlong fact, When checked, Then it is refused", () => {
  assertEquals(typeof factRejectReason("x".repeat(501)), "string");
});
Deno.test("Unknown topics fall back to general", () => {
  assertEquals(normalizeTopic("hack"), "general");
  assertEquals(normalizeTopic("orders"), "orders");
});
Deno.test("Knowledge block says rules win over learned facts", () => {
  assertEquals(knowledgeBlock([{ id: "1", topic: "orders", content: "A" }]).includes("the rules win"), true);
});
