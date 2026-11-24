import { describe, expect, it } from "vitest";
import { showAssistantBubble } from "./bubbleVisibility";

describe("showAssistantBubble", () => {
  it("shows for admins on team pages", () => {
    expect(showAssistantBubble("/dashboard", "admin")).toBe(true);
    expect(showAssistantBubble("/invoices/123", "admin")).toBe(true);
  });
  it("never shows for non-admins", () => {
    expect(showAssistantBubble("/dashboard", "agent")).toBe(false);
    expect(showAssistantBubble("/dashboard", "client")).toBe(false);
  });
  it("hides on the full assistant page, client portal and public site", () => {
    expect(showAssistantBubble("/assistant/abc", "admin")).toBe(false);
    expect(showAssistantBubble("/client/invoices", "admin")).toBe(false);
    expect(showAssistantBubble("/", "admin")).toBe(false);
    expect(showAssistantBubble("/kontakt", "admin")).toBe(false);
  });
});
