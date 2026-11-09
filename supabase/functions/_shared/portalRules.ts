import { isTeamEmail } from "./teamEmails.ts";

export type PortalDecision =
  | { action: "skip"; reason: "invalid_email" | "team_email" }
  | { action: "link_existing" }
  | { action: "create_and_send" };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

/** Decide what to do for an email. Existing accounts are never reset or re-emailed. */
export function decidePortalAction(email: string | null | undefined, hasAccount: boolean): PortalDecision {
  const e = normalizeEmail(email);
  if (!EMAIL_RE.test(e)) return { action: "skip", reason: "invalid_email" };
  if (isTeamEmail(e)) return { action: "skip", reason: "team_email" };
  return hasAccount ? { action: "link_existing" } : { action: "create_and_send" };
}
