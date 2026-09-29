/** Monthly invoice due date: never before the issue date — max(issue + 7 days, installment due). */
export function computeDueDate(issueDate: string, installmentDue?: string | null): string {
  const d = new Date(issueDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 7);
  const min = d.toISOString().split("T")[0];
  return installmentDue && installmentDue > min ? installmentDue : min;
}
