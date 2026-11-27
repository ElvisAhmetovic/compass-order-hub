export type ClientLite = { id: string; name: string; contact_person: string | null; email: string; phone: string | null };

export const normEmail = (e: string | null | undefined) => (e ?? "").trim().toLowerCase();

/** Finds the client whose email matches (case- and whitespace-insensitive). */
export function matchClientByEmail<T extends { email: string }>(clients: T[], email: string | null | undefined): T | null {
  const e = normEmail(email);
  if (!e) return null;
  return clients.find((c) => normEmail(c.email) === e) ?? null;
}
