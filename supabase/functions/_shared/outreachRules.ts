// Rules for AI win-back offers. Pure functions so they can be tested.
export const INACTIVE_DAYS = 90; // about 3 months without an order
export const COOLDOWN_DAYS = 90; // no new offer within 90 days of the last one
export const DAILY_SEND_LIMIT = 50;
export const SCAN_BATCH = 10;

const DAY = 86_400_000;

export function isInactive(lastOrderAt: Date, now: Date): boolean {
  return now.getTime() - lastOrderAt.getTime() >= INACTIVE_DAYS * DAY;
}

export function inCooldown(lastContactAt: Date | null, now: Date): boolean {
  if (!lastContactAt) return false;
  return now.getTime() - lastContactAt.getTime() < COOLDOWN_DAYS * DAY;
}

export function remainingDailyQuota(sentToday: number): number {
  return Math.max(0, DAILY_SEND_LIMIT - sentToday);
}

function sarajevoParts(now: Date) {
  const f = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Sarajevo", weekday: "short", hour: "2-digit", hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit",
  });
  const p = Object.fromEntries(f.formatToParts(now).map((x) => [x.type, x.value]));
  return { weekday: p.weekday, hour: Number(p.hour), date: `${p.year}-${p.month}-${p.day}` };
}

/** Weekdays 09:00–17:00 Sarajevo time. */
export function isSendWindow(now: Date): boolean {
  const { weekday, hour } = sarajevoParts(now);
  if (weekday === "Sat" || weekday === "Sun") return false;
  return hour >= 9 && hour < 17;
}

export function sarajevoDate(now: Date): string {
  return sarajevoParts(now).date;
}

export const WIN_BACK_DAYS = 60;

/** A client counts as won back when they order after the offer was sent, within 60 days. */
export function isWinBack(sentAt: Date, orderAt: Date): boolean {
  const diff = orderAt.getTime() - sentAt.getTime();
  return diff > 0 && diff <= WIN_BACK_DAYS * DAY;
}

export type InvoiceLite = { status: string | null; paid_at: string | null };
/** A client with any sent-but-unpaid invoice gets no offer. Drafts, paid and cancelled don't count. */
export function hasUnpaidInvoice(invoices: InvoiceLite[]): boolean {
  return invoices.some((i) => (i.status === "sent" || i.status === "overdue" || i.status === "partially_paid") && !i.paid_at);
}

export type ContractLite = { status: string | null; stopped_at: string | null; updated_at: string | null };
/** Stopped or completed packages count as older contracts that can be won back. */
export function isLapsedContract(c: ContractLite): boolean {
  return c.status === "stopped" || c.status === "completed";
}
export function contractEndedAt(c: ContractLite): Date | null {
  const d = c.stopped_at ?? c.updated_at;
  return d ? new Date(d) : null;
}

/** The automatic scan runs in the first 7 days of each month (weekdays), 10 drafts per run. */
export function isMonthlyScanWindow(now: Date): boolean {
  return Number(sarajevoDate(now).slice(8, 10)) <= 7;
}

/** Test emails always go to the signed-in person who clicked, never to the client. */
export function testRecipient(callerEmail: string | null | undefined): string | null {
  const e = (callerEmail ?? "").trim().toLowerCase();
  return e.includes("@") ? e : null;
}

export const OUTREACH_SHARED_MAILBOX = "invoice@mediaamarketing.com";
export const OUTREACH_FROM = "Media Marketing <office@mediaamarketing.com>";

/** Replies go to the shared team mailbox, labelled with the sender, plus the sender's own address. */
export function outreachReplyTo(senderName: string, senderEmail: string | null, draftId?: string, inboundDomain?: string | null): string[] {
  const label = `${(senderName || "Media Marketing").replace(/["<>]/g, "")} (AI Outreach)`;
  const domain = inboundDomain?.trim().toLowerCase();
  const box = domain && draftId ? `reply+${draftId}@${domain}` : OUTREACH_SHARED_MAILBOX;
  const list = [`"${label}" <${box}>`];
  const e = senderEmail?.trim().toLowerCase();
  if (e && e !== OUTREACH_SHARED_MAILBOX) list.push(e);
  return list;
}

/** Subject reference with the sender's initials, e.g. "[Ref JN-AO]". */
export function outreachSubjectRef(senderName: string): string {
  const initials = (senderName || "").split(/\s+/).filter(Boolean).map((p) => p[0]!.toUpperCase()).join("").slice(0, 3) || "MM";
  return `[Ref ${initials}-AO]`;
}

export function withSubjectRef(subject: string, senderName: string): string {
  const ref = outreachSubjectRef(senderName);
  return subject.includes(ref) ? subject : `${subject.slice(0, 200 - ref.length - 1)} ${ref}`;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Finds the offer id in a reply address like "reply+<id>@replies.example.com". */
export function draftIdFromAddresses(addresses: string[]): string | null {
  for (const a of addresses) {
    const m = /reply\+([^@\s>]+)@/i.exec(a ?? "");
    if (m && UUID.test(m[1])) return m[1].toLowerCase();
  }
  return null;
}

/** Splits '"Jane Doe" <jane@x.com>' into name and lowercase email. */
export function parseFromHeader(from: string): { name: string | null; email: string } {
  const m = /^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/.exec(from ?? "");
  if (m) return { name: m[1].trim() || null, email: m[2].trim().toLowerCase() };
  return { name: null, email: (from ?? "").trim().toLowerCase() };
}

export type OutreachTicketDraft = { subject: string; approved_by_name: string | null; company_name: string | null } | null;
export type OutreachTicketReply = { from_email: string; from_name: string | null; subject: string; text_body: string | null };

/** Builds the support ticket opened automatically for every client reply to an outreach offer. */
export function buildOutreachTicket(reply: OutreachTicketReply, draft: OutreachTicketDraft) {
  const subj = (reply.subject || "(no subject)").trim();
  const notes = draft
    ? `Reply to AI outreach offer "${draft.subject}". Offer sent by ${draft.approved_by_name || "unknown"}.`
    : "Unmatched outreach reply — could not be linked to a specific offer.";
  return {
    subject: `Outreach reply: ${subj}`.slice(0, 300),
    client_subject: subj.slice(0, 300),
    client_email: reply.from_email,
    client_name: reply.from_name,
    company_name: draft?.company_name ?? null,
    message: (reply.text_body ?? "").slice(0, 20000) || null,
    notes,
    status: "open",
  };
}

/** First non-blank business name, in priority order (offer, client, company, latest order). */
export function pickCompanyName(...candidates: Array<string | null | undefined>): string | null {
  for (const c of candidates) { const t = (c ?? "").trim(); if (t) return t; }
  return null;
}

// ---- Automatic follow-up to outreach replies (team-written template only, never AI) ----
export type ReplyTemplate = { enabled: boolean; subject_en: string; body_en: string; subject_de: string; body_de: string };
export type FollowUpVars = { client_name?: string | null; company_name?: string | null; sender_name?: string | null };

const escHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Fills {client_name}, {company_name}, {sender_name}; German when lang starts with "de", else English. */
export function renderReplyFollowUp(t: ReplyTemplate, lang: string | null | undefined, v: FollowUpVars) {
  const de = (lang ?? "").toLowerCase().startsWith("de");
  const fill = (s: string) => s
    .replace(/\{client_name\}/g, (v.client_name ?? "").trim() || (de ? "Sehr geehrte Damen und Herren" : "there"))
    .replace(/\{company_name\}/g, (v.company_name ?? "").trim())
    .replace(/\{sender_name\}/g, (v.sender_name ?? "").trim() || (de ? "Unser Team" : "Our team"));
  const subject = fill(de ? t.subject_de : t.subject_en).replace(/[\r\n]+/g, " ").trim().slice(0, 200);
  const text = fill(de ? t.body_de : t.body_en).trim();
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6">${escHtml(text).replace(/\n/g, "<br>")}</div>`;
  return { subject, text, html };
}

const AUTO_SUBJECT = /(out of (the )?office|abwesenheit|automatic reply|auto(matische)? ?(antwort|reply)|autoreply|urlaub|vacation|undeliverable|delivery status|unzustellbar)/i;
const SYSTEM_SENDER = /^(mailer-daemon|postmaster|no-?reply|do-?not-?reply|bounce)/i;
const OWN_DOMAINS = ["mediaamarketing.com", "empriatech.com", "empriadental.de"];

export type FollowUpCheck = {
  template: ReplyTemplate | null; linkedToOffer: boolean; fromEmail: string; subject: string;
  headers: Record<string, string>; optedOut: boolean; alreadySent: boolean;
};

/** Returns null when a follow-up may be sent, otherwise the skip reason. */
export function followUpSkipReason(c: FollowUpCheck): string | null {
  if (!c.template?.enabled) return "disabled";
  if (!c.linkedToOffer) return "not_linked";
  if (c.alreadySent) return "already_sent";
  if (c.optedOut) return "opted_out";
  const email = c.fromEmail.trim().toLowerCase();
  const domain = email.split("@")[1] ?? "";
  if (!email.includes("@") || SYSTEM_SENDER.test(email)) return "system_sender";
  if (OWN_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`))) return "own_address";
  const h = Object.fromEntries(Object.entries(c.headers).map(([k, v]) => [k.toLowerCase(), String(v).toLowerCase()]));
  if ((h["auto-submitted"] && h["auto-submitted"] !== "no") || h["x-autoreply"] || h["x-autorespond"]
    || /bulk|auto_reply|junk|list/.test(h["precedence"] ?? "")) return "auto_reply";
  if (AUTO_SUBJECT.test(c.subject)) return "auto_reply";
  return null;
}

/** True for newsletters / mailing-list mail (List-Unsubscribe, List-Id or Precedence bulk/list). */
export function isBulkMail(headers: Record<string, string>): boolean {
  const h = Object.fromEntries(Object.entries(headers ?? {}).map(([k, v]) => [k.toLowerCase(), String(v).toLowerCase()]));
  return !!(h["list-unsubscribe"] || h["list-id"]) || /bulk|list/.test(h["precedence"] ?? "");
}

/** Returns null when a reply should open a ticket, otherwise why not. */
export function ticketSkipReason(c: { linkedToOffer: boolean; knownClient: boolean; headers: Record<string, string> }): string | null {
  if (c.linkedToOffer) return null;
  if (isBulkMail(c.headers)) return "newsletter";
  if (c.knownClient) return null;
  return "unknown_sender";
}

/** Same email layout as outreach offers: paragraphs, contact name, contact line, unsubscribe link. */
export function renderOutreachHtml(body: string, opts: { de: boolean; contactName?: string | null; unsubUrl: string }): string {
  const paras = body.split(/\n\s*\n/).map((p) => `<p>${escHtml(p).replace(/\n/g, "<br>")}</p>`).join("");
  return `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#1f2937">
${paras}
${opts.contactName ? `<p>${opts.de ? "Ihr Ansprechpartner" : "Your contact"}: ${escHtml(opts.contactName)}</p>` : ""}
<p style="color:#6b7280;font-size:12px">invoice@mediaamarketing.com · +49 203 7090 1754 · <a href="https://www.mediaamarketing.com/de">mediaamarketing.com</a></p>
<p style="color:#9ca3af;font-size:11px"><a href="${opts.unsubUrl}" style="color:#9ca3af">${opts.de ? "Keine weiteren Angebote erhalten" : "Don't send me offers anymore"}</a></p></div>`;
}

/** "Re: " prefix once. */
export function replySubject(s: string): string {
  const t = (s || "").trim();
  return /^re:/i.test(t) ? t : `Re: ${t}`;
}

/** Forward a client reply to the offer's sender only once, only for real replies. */
export function shouldForwardReply(c: { linked: boolean; bulk: boolean; autoReply: boolean; fromTeam: boolean; alreadyForwarded: boolean; to: string | null }): boolean {
  return c.linked && !c.bulk && !c.autoReply && !c.fromTeam && !c.alreadyForwarded && !!c.to && c.to.includes("@");
}

export function renderForwardEmail(v: { clientName: string; companyName: string | null; subject: string; offerDate: string | null; text: string | null; link: string }) {
  const subject = `Client reply: ${v.subject || "(no subject)"}${v.companyName ? ` – ${v.companyName}` : ""}`.replace(/[\r\n]+/g, " ").slice(0, 200);
  const intro = `${v.clientName} replied to your offer${v.offerDate ? ` from ${v.offerDate}` : ""}.`;
  const body = (v.text || "(This email has no plain-text content.)").trim();
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#1f2937"><p><b>${escHtml(intro)}</b></p>
<div style="border-left:3px solid #d1d5db;padding-left:12px;white-space:pre-wrap">${escHtml(body)}</div>
<p><a href="${v.link}">Open in Empria</a> · Reply to this email to answer the client directly.</p></div>`;
  return { subject, html, text: `${intro}\n\n${body}\n\nOpen in Empria: ${v.link}` };
}
