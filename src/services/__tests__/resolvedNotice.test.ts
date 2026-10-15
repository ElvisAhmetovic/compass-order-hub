import { describe, it, expect } from "vitest";
import { RESOLVED_SERVICE_NOTICE } from "../paymentReminderCopy";

describe("resolved service notice", () => {
  it("English says the service is completed and payment is due", () => {
    expect(RESOLVED_SERVICE_NOTICE.en).toContain("fully completed and resolved");
    expect(RESOLVED_SERVICE_NOTICE.en).toContain("{amount}");
  });
  it("German says the service is completed and payment is due", () => {
    expect(RESOLVED_SERVICE_NOTICE.de).toContain("vollständig erbracht und abgeschlossen");
    expect(RESOLVED_SERVICE_NOTICE.de).toContain("{amount}");
  });
});
