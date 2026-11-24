import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const { invoke, action } = vi.hoisted(() => ({
  invoke: vi.fn(),
  action: { id: "action-1", tool: "bulk_set_status", summary: "Change two invoices", status: "pending", result: null, args: { status: "paid", targets: [{ id: "i1", invoice_number: "INV-1", status: "sent" }, { id: "i2", invoice_number: "INV-2", status: "sent" }] } },
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: action, error: null }) }) }) }),
  functions: { invoke },
} }));
vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));
vi.mock("./InvoiceResultActions", () => ({ InvoiceResultActions: () => null }));
import { ConfirmActionCard } from "./ConfirmActionCard";

describe("assistant confirmation boundary", () => {
  beforeEach(() => { invoke.mockReset(); });
  it("does nothing until Confirm, then submits the reviewed action once", async () => {
    invoke.mockResolvedValue({ data: { status: "confirmed", result: { results: [{ id: "i1", status: "done" }, { id: "i2", status: "done" }] } }, error: null });
    render(<ConfirmActionCard actionId="action-1" />);
    const confirm = await screen.findByRole("button", { name: "Confirm" });
    expect(invoke).not.toHaveBeenCalled();
    fireEvent.click(confirm);
    await waitFor(() => expect(invoke).toHaveBeenCalledTimes(1));
    expect(invoke).toHaveBeenCalledWith("admin-assistant-confirm", { body: { actionId: "action-1", decision: "confirm" } });
    await waitFor(() => expect(screen.queryByRole("button", { name: "Confirm" })).toBeNull());
  });
  it("Cancel sends only the cancel decision, never a confirm", async () => {
    invoke.mockResolvedValue({ data: { status: "cancelled", result: null }, error: null });
    render(<ConfirmActionCard actionId="action-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(invoke).toHaveBeenCalledWith("admin-assistant-confirm", { body: { actionId: "action-1", decision: "cancel" } }));
    expect(invoke).toHaveBeenCalledTimes(1);
  });
  it("keeps per-record outcomes when the server returns a partial failure", async () => {
    invoke.mockResolvedValue({ data: null, error: { message: "Request failed", context: new Response(JSON.stringify({ status: "failed", result: { error: "Some records were not changed", results: [{ id: "i1", status: "done" }, { id: "i2", status: "failed", message: "Record changed since review" }] } }), { status: 422 }) } });
    render(<ConfirmActionCard actionId="action-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));
    await screen.findByText("Not completed — Record changed since review");
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Confirm" })).toBeNull();
  });
});