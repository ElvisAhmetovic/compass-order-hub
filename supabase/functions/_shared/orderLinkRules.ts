// Rules for one-time Stripe payment links on normal orders.

/** Gross amount in cents: net + VAT (rate in percent, e.g. 19). */
export function orderLinkAmountCents(net: number, vatEnabled: boolean, ratePercent: number): number {
  const netCents = Math.round(Number(net) * 100);
  if (!vatEnabled || !(ratePercent > 0)) return netCents;
  return Math.round(netCents * (1 + ratePercent / 100));
}

/** A payment only counts for a link that is still the current (pending) one. */
export function canMarkLinkPaid(status: string): boolean {
  return status === "pending";
}
