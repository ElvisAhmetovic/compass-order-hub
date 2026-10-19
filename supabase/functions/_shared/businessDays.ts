// Automatic client emails only go out Monday–Friday in company local time.
export const COMPANY_TIMEZONE = "Europe/Sarajevo";

export function isCompanyWeekend(date: Date = new Date()): boolean {
  const weekday = new Intl.DateTimeFormat("en-GB", { timeZone: COMPANY_TIMEZONE, weekday: "short" }).format(date);
  return weekday === "Sat" || weekday === "Sun";
}
