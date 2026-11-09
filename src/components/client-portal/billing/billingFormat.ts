import { de, enGB, fr, nl, sv } from "date-fns/locale";
import type { Locale } from "date-fns";

const LOCALES: Record<string, Locale> = { de, en: enGB, fr, nl, sv };
const INTL: Record<string, string> = { de: "de-DE", en: "en-GB", fr: "fr-FR", nl: "nl-NL", sv: "sv-SE" };

export const dateLocale = (lang: string): Locale => LOCALES[lang] ?? enGB;

/** Prices always use the European format (e.g. €399,99), whatever the language. */
export const money = (v: number, c = "EUR") =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: (c || "EUR").toUpperCase() }).format(Number(v || 0));

/** Dates follow the client's chosen language. */
export const day = (d: string | null | undefined, lang = "de") =>
  d ? new Date(d).toLocaleDateString(INTL[lang] ?? "de-DE") : "–";
