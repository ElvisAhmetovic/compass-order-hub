const PUBLIC_EXACT = ["/", "/login", "/register", "/kontakt", "/ueber-uns", "/impressum", "/datenschutz", "/terms", "/webdesign", "/google-seo", "/digital-marketing", "/app-entwicklung", "/ticket-loading", "/ticket-submitted", "/offers-unsubscribed"];
const HIDDEN_PREFIXES = ["/assistant", "/client", "/payment", "/confirm-offer", "/reset-password", "/forgot-password"];

/** The floating assistant shows only for admins on team pages. */
export function showAssistantBubble(path: string, role?: string | null): boolean {
  if (role !== "admin") return false;
  if (PUBLIC_EXACT.includes(path)) return false;
  return !HIDDEN_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`) || path.startsWith(`${p}-`));
}
