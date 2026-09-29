// Only these accounts may see company money totals (privacy).
export const FINANCE_VIEWER_EMAILS = [
  "business@team-abmedia.com", // Johann Nowak
  "kontakt.abmedia@gmail.com", // Thomas Klein
  "luciferbebistar@gmail.com", // Max Pfenning
];

export const canViewFinanceTotals = (email?: string | null) =>
  !!email && FINANCE_VIEWER_EMAILS.includes(email.trim().toLowerCase());
