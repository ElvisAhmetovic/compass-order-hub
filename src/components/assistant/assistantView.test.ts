import { describe, it, expect } from "vitest";
import { toChatMessage, assistantPath } from "./assistantView";

describe("assistant view", () => {
  it("keeps proposed action ids so Confirm cards come back after reload", () => {
    const m = toChatMessage({ id: "1", role: "assistant", content: "ok", parts: { actions: ["a1"], trace: [] } });
    expect(m.parts.actions).toEqual(["a1"]);
  });
  it("treats broken parts as empty", () => {
    expect(toChatMessage({ id: "2", role: "user", content: "hi", parts: [] }).parts).toEqual({ trace: [], actions: [] });
  });
  it("each chat has its own link", () => {
    expect(assistantPath("abc")).toBe("/assistant/abc");
    expect(assistantPath()).toBe("/assistant");
  });
});
