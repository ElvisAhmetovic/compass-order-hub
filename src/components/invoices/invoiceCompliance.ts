// Legally required / recommended invoice details (service date, registered office, reverse charge).
// German and English wording; other invoice languages fall back to English.

export const REGISTERED_OFFICE = "Monomark House, 27 Old Gloucester Street, London WC1N 3AX, United Kingdom";
export const OFFICE_ADDRESS = "Düsseldorfer Str. 32, 47051 Duisburg";

const LABELS = {
  en: {
    serviceDate: "Service date:",
    servicePeriod: "Service period:",
    registeredOffice: "Registered office:",
    officeAddress: "Office address:",
    reverseChargeTax: "VAT: Reverse Charge",
    reverseChargeNote:
      "Place of supply: Germany pursuant to § 3a (2) UStG. Reverse charge – the recipient of the service is liable for VAT pursuant to § 13b UStG. No German VAT is charged.",
  },
  de: {
    serviceDate: "Leistungsdatum:",
    servicePeriod: "Leistungszeitraum:",
    registeredOffice: "Registrierter Sitz:",
    officeAddress: "Büroadresse:",
    reverseChargeTax: "USt: Reverse Charge",
    reverseChargeNote:
      "Leistungsort: Deutschland gemäß § 3a Abs. 2 UStG. Steuerschuldnerschaft des Leistungsempfängers (Reverse Charge) gemäß § 13b UStG. Es wird keine deutsche Umsatzsteuer in Rechnung gestellt.",
  },
};

export type ComplianceLabels = typeof LABELS.en;

export const getComplianceLabels = (language?: string): ComplianceLabels =>
  language === "de" ? LABELS.de : LABELS.en;

/** Returns the label and text for the service date line; falls back to the issue date. */
export const getServiceDateLine = (
  language: string | undefined,
  invoice: { issue_date?: string; service_date?: string | null; service_period_end?: string | null } | undefined,
  formatDate: (d: string) => string,
): { label: string; value: string } => {
  const l = getComplianceLabels(language);
  const start = invoice?.service_date || invoice?.issue_date || new Date().toISOString();
  const end = invoice?.service_period_end;
  if (end && end !== start) {
    return { label: l.servicePeriod, value: `${formatDate(start)} – ${formatDate(end)}` };
  }
  return { label: l.serviceDate, value: formatDate(start) };
};
