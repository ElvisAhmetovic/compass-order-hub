import { describe, it, expect } from "vitest";
import { buildOrderUpdatePayload } from "./useOrderEdit";
import type { Order } from "@/types";

const order = { id: "o1", company_name: "RG Cars" } as unknown as Order;

describe("order edit save payload", () => {
  it("keeps internal notes out of the client update and saves the new price", () => {
    const p = buildOrderUpdatePayload(
      { company_name: "RG Cars", price: 600, internal_notes: "secret", client_visible_update: "" } as never,
      order,
    );
    expect(p.internal_notes).toBe("secret");
    expect(p.client_visible_update).toBe("");
    expect(p.price).toBe(600);
  });
});
