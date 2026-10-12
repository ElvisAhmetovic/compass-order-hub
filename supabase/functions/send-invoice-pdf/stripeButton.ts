// Builds the email-safe "pay online" button; returns "" for anything that isn't a valid https link.
export const escapeHtml = (t: string) =>
  String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]!));

export const buildStripeButton = (link: unknown, label: unknown): string => {
  if (typeof link !== "string" || !link.trim()) return "";
  let u: URL;
  try { u = new URL(link.trim()); } catch { return ""; }
  if (u.protocol !== "https:") return "";
  const text = typeof label === "string" && label.trim() ? label.trim().slice(0, 80) : "Pay online with Stripe";
  return `<div style="margin: 24px 0;"><a href="${escapeHtml(u.toString())}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: #635bff; color: #ffffff; font-weight: bold; font-size: 15px; padding: 12px 24px; border-radius: 6px; text-decoration: none;">${escapeHtml(text)}</a></div>`;
};
