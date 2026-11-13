import { describe, it, expect } from "vitest";
import { buildClientUpdateMessage, DEFAULT_CLIENT_UPDATE_MESSAGE } from "./clientUpdateMessage";

describe("buildClientUpdateMessage", () => {
  it("uses the client update and never internal notes", () => {
    const msg = buildClientUpdateMessage({ client_visible_update: "Design ready", internal_notes: "SECRET" } as never);
    expect(msg).toBe("Design ready");
    expect(msg).not.toContain("SECRET");
  });
  it("falls back to the neutral line when there is no client update", () => {
    expect(buildClientUpdateMessage({ client_visible_update: "  " } as never)).toBe(DEFAULT_CLIENT_UPDATE_MESSAGE);
  });
});
