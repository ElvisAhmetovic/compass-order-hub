import { describe, expect, it } from "vitest";
import { batchTargets, batchResults } from "./batchActionView";

describe("reviewed assistant batches", () => {
  it("retains every recipient and CC for human review", () => {
    expect(batchTargets({ targets: [{ id: "i1", invoice_number: "INV-1", recipient: "client@example.com", cc: ["invoice@mediaamarketing.com"], language: "de" }] })).toEqual([{ id: "i1", label: "INV-1", detail: "client@example.com · CC: invoice@mediaamarketing.com · DE" }]);
  });
  it("retains individual failures instead of reporting the whole batch done", () => {
    expect(batchResults({ results: [{ id: "i1", status: "done" }, { id: "i2", status: "failed", message: "Record changed" }] })).toEqual([{ id: "i1", status: "done", message: "" }, { id: "i2", status: "failed", message: "Record changed" }]);
  });
});