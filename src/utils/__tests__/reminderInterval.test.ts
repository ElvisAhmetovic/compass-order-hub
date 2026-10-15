import { describe, it, expect, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { reminderIntervalForOrder } from "../reminderInterval";

describe("reminder interval", () => {
  it("is 3 days for resolved orders", () => expect(reminderIntervalForOrder(true)).toBe(72));
  it("is 7 days otherwise", () => expect(reminderIntervalForOrder(false)).toBe(168));
});
