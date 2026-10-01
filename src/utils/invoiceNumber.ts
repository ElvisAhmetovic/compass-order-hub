/** Applies a display prefix without duplicating a prefix already stored in the invoice number. */
export function formatInvoiceNumber(invoiceNumber: string, prefix = ""): string {
  const number = invoiceNumber.trim();
  const normalizedPrefix = prefix.trim();

  if (!normalizedPrefix || number.toLocaleLowerCase().startsWith(normalizedPrefix.toLocaleLowerCase())) {
    return number;
  }

  return `${normalizedPrefix}${number}`;
}