import { Client } from "@/types/invoice";

const norm = (s?: string | null) => (s || "").toLowerCase().trim();

/**
 * Picks the existing client for an order without letting a shared email hijack a different company:
 * 1) name + email match, 2) email match only when the names overlap, 3) exact name match.
 * Returns undefined when a new client should be created.
 */
export const resolveOrderClient = (
  clients: Pick<Client, "id" | "name" | "email">[],
  order: { company_name?: string | null; contact_email?: string | null }
): string | undefined => {
  const email = norm(order.contact_email);
  const name = norm(order.company_name);
  let id = email ? clients.find((c) => norm(c.name) === name && norm(c.email) === email)?.id : undefined;
  if (!id && email && name) {
    id = clients.find((c) => {
      const n = norm(c.name);
      return norm(c.email) === email && n && (n.includes(name) || name.includes(n));
    })?.id;
  }
  if (!id && name) id = clients.find((c) => norm(c.name) === name)?.id;
  return id;
};
