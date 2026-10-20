/** Template VAT rate is entered as a percent (19); line items store a fraction (0.19). */
export const toVatFraction = (percent: unknown): number => {
  const n = Number(percent);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(Math.min(n, 99.99) * 100) / 10000;
};

/** New lines start at the invoice's VAT rate when VAT is enabled, otherwise 0. */
export const getDefaultLineVatRate = (settings: { vatEnabled?: boolean; vatRate?: unknown } | undefined): number =>
  settings?.vatEnabled === false ? 0 : toVatFraction(settings?.vatRate);
