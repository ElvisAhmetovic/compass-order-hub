import { describe, it, expect } from "vitest";
import { activitySummary, describeActivity } from "./portalActivityView";

describe("portal activity log", () => {
  it("counts logins, distinct active clients and pay clicks", () => {
    const s = activitySummary([
      { event: "login", user_id: "a" }, { event: "login", user_id: "a" },
      { event: "pay_clicked", user_id: "b" }, { event: "load_failed", user_id: "b" },
    ]);
    expect(s).toEqual({ logins: 2, activeClients: 2, payClicks: 1, loadErrors: 1 });
  });
  it("names pages for page views", () => expect(describeActivity({ event: "page_view", details: { page: "/client/orders/:id" } })).toBe("Order details"));
  it("names the payment type", () => expect(describeActivity({ event: "pay_clicked", details: { type: "order_link" } })).toBe("order payment link"));
});
