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
