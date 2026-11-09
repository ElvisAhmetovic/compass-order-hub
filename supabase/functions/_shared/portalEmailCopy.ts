// Shared client-portal copy for client emails (German first, then English).
export const PORTAL_LOGIN_URL = "https://www.empriatech.com/client/login";

/** One bilingual line telling the client they can also see/pay this in the portal. */
export function portalLineHtml(url: string = PORTAL_LOGIN_URL): string {
  return `<p style="font-size:13px;color:#64748b;margin-top:16px">Sie können diese Rechnung auch in Ihrem Kundenportal ansehen und bezahlen: <a href="${url}">${url}</a><br/>You can also see this invoice and pay it in your client portal: <a href="${url}">${url}</a></p>`;
}

export function credentialsSubject(isResend: boolean, company = "Media Marketing"): string {
  return isResend
    ? `Ihre neuen Zugangsdaten / Your updated portal login – ${company}`
    : `Willkommen im Kundenportal / Welcome to your client portal – ${company}`;
}
