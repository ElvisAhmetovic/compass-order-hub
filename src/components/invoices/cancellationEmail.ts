export type CancellationMode = "cancelled" | "deleted";

export interface CancellationCandidate {
  status?: string | null;
  bill_to_email?: string | null;
  client?: { email?: string | null } | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Email the client finally receives, or null when there is none. */
export function cancellationRecipient(inv: CancellationCandidate): string | null {
  const to = (inv.bill_to_email || inv.client?.email || "").trim();
  return EMAIL_RE.test(to) ? to : null;
}

/** Drafts were never sent to the client, so cancelling/deleting them needs no storno email. */
export function shouldOfferCancellationEmail(previousStatus: string | null | undefined): boolean {
  return !!previousStatus && previousStatus !== "draft" && previousStatus !== "cancelled";
}
