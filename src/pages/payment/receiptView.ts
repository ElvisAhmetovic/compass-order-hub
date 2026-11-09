export type Receipt = {
  kind: "order" | "package"; title: string; amount: number; currency: string; paid: boolean;
  date: string; reference: string; invoice_number: string | null; receipt_url: string | null; next_charge: string | null;
};

export type ReceiptState = "loading" | "confirming" | "paid" | "notFound" | "error";

/** Which state the confirmation page shows. Unpaid sessions keep "confirming" until polling gives up, then show not found. */
export function receiptState(r: Receipt | null, opts: { loading: boolean; notFound: boolean; failed: boolean; gaveUp: boolean }): ReceiptState {
  if (opts.notFound) return "notFound";
  if (opts.failed && !r) return "error";
  if (!r) return "loading";
  if (r.paid) return "paid";
  return opts.gaveUp ? "notFound" : "confirming";
}

/** Next-step keys shown below the payment details. */
export function nextSteps(r: Receipt): string[] {
  const steps = ["email"];
  if (r.kind === "package") steps.push(r.next_charge ? "packageNext" : "packageActive");
  else steps.push("orderTeam");
  steps.push("contact");
  return steps;
}
