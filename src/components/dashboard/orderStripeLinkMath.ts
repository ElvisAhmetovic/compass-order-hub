/** Total the client pays: net + VAT (percent), rounded to cents. Mirrors the server rule. */
export function grossAmount(net: number, vatOn: boolean, ratePercent: number): number {
  const cents = Math.round(net * 100);
  return (vatOn && ratePercent > 0 ? Math.round(cents * (1 + ratePercent / 100)) : cents) / 100;
}
