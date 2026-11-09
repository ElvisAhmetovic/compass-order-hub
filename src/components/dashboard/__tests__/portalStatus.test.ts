import { describe, it, expect, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { portalStatusFrom, PORTAL_LABEL } from "../portalStatus";

describe("portal status label", () => {
  it("no account → No portal", () => expect(PORTAL_LABEL[portalStatusFrom(false, null)]).toBe("No portal"));
  it("account never signed in → invited", () => expect(portalStatusFrom(true, null)).toBe("invited"));
  it("account signed in → active", () => expect(portalStatusFrom(true, "2026-11-01T10:00:00Z")).toBe("active"));
});
