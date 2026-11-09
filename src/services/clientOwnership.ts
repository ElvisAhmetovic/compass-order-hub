/**
 * One rule for "which orders belong to this portal client", used by every
 * portal query on the `client_orders` view. The database enforces the same
 * rule (public.client_owns_order); this filter keeps queries scoped.
 * An order belongs to the client when it is linked to their account
 * (client_id), its company belongs to them (client_user_id), or its contact
 * email is their login email.
 */
const quote = (v: string) => `"${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

export function clientOrderOwnershipFilter(userId: string, email?: string | null): string {
  const parts = [`client_id.eq.${userId}`, `client_user_id.eq.${userId}`];
  const e = (email ?? "").trim().toLowerCase();
  if (e) parts.push(`contact_email.ilike.${quote(e)}`);
  return parts.join(",");
}
