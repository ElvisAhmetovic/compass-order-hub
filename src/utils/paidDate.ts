/** Label shown above a paid invoice's status, e.g. "Paid 27.10.2026". */
export function paidDateLabel(status: string | null | undefined, paidAt: string | null | undefined): string | null {
  if (status !== "paid" || !paidAt) return null;
  const d = new Date(paidAt);
  if (isNaN(d.getTime())) return null;
  return `Paid ${d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Sarajevo" })}`;
}

export function paidDateTime(paidAt: string): string {
  return new Date(paidAt).toLocaleString("de-DE", { timeZone: "Europe/Sarajevo" });
}
