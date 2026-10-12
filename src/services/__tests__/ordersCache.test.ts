import { describe, it, expect, vi, beforeEach } from "vitest";

const calls = { n: 0 };
vi.mock("@/integrations/supabase/client", () => {
  const q: any = {
    select: () => q, neq: () => q, is: () => q,
    order: async () => { calls.n++; return { data: [{ id: "a" }], error: null }; },
  };
  return { supabase: { from: () => q } };
});

import { OrderService, clearOrdersCache } from "../orderService";

describe("shared orders cache", () => {
  beforeEach(() => { clearOrdersCache(); calls.n = 0; });

  it("loads once when several widgets ask at the same time", async () => {
    await Promise.all([OrderService.getOrders(), OrderService.getOrders(), OrderService.getOrders()]);
    expect(calls.n).toBe(1);
  });

  it("loads again after an order change clears the cache", async () => {
    await OrderService.getOrders();
    clearOrdersCache();
    await OrderService.getOrders();
    expect(calls.n).toBe(2);
  });
});
