/** Detects a client's country from an order address (any common spelling) or, failing that, the email domain. */

type CountryRule = { code: string; name: string; words: string[] };

// Order matters: more specific names first (e.g. "Niederlande" before "Deutschland" matching nothing else).
const COUNTRIES: CountryRule[] = [
  { code: "NL", name: "Netherlands", words: ["netherlands", "niederlande", "nederland", "holland", "pays-bas", "países bajos"] },
  { code: "BE", name: "Belgium", words: ["belgium", "belgien", "belgië", "belgie", "belgique"] },
  { code: "DE", name: "Germany", words: ["germany", "deutschland", "allemagne", "duitsland", "germania", "alemania"] },
  { code: "AT", name: "Austria", words: ["austria", "österreich", "osterreich", "oostenrijk", "autriche"] },
  { code: "CH", name: "Switzerland", words: ["switzerland", "schweiz", "suisse", "svizzera", "zwitserland"] },
  { code: "FR", name: "France", words: ["france", "frankreich", "frankrijk", "francia"] },
  { code: "IT", name: "Italy", words: ["italy", "italien", "italia", "italie", "italië"] },
  { code: "ES", name: "Spain", words: ["spain", "spanien", "españa", "espana", "espagne", "spanje"] },
  { code: "PT", name: "Portugal", words: ["portugal"] },
  { code: "DK", name: "Denmark", words: ["denmark", "dänemark", "danemark", "danmark", "denemarken"] },
  { code: "NO", name: "Norway", words: ["norway", "norwegen", "norge", "noorwegen", "norvège"] },
  { code: "SE", name: "Sweden", words: ["sweden", "schweden", "sverige", "zweden", "suède"] },
  { code: "CZ", name: "Czechia", words: ["czechia", "czech republic", "tschechien", "česko", "česká republika", "tsjechië"] },
  { code: "PL", name: "Poland", words: ["poland", "polen", "polska", "pologne"] },
  { code: "RO", name: "Romania", words: ["romania", "rumänien", "românia", "roemenië"] },
  { code: "HU", name: "Hungary", words: ["hungary", "ungarn", "magyarország", "hongarije"] },
  { code: "TR", name: "Turkey", words: ["turkey", "türkei", "türkiye", "turkije"] },
  { code: "GB", name: "United Kingdom", words: ["united kingdom", "england", "scotland", "wales", "großbritannien", "grossbritannien", "verenigd koninkrijk", " uk"] },
  { code: "IE", name: "Ireland", words: ["ireland", "irland", "ierland"] },
  { code: "LU", name: "Luxembourg", words: ["luxembourg", "luxemburg"] },
];

const TLD: Record<string, string> = {
  nl: "NL", be: "BE", de: "DE", at: "AT", ch: "CH", fr: "FR", it: "IT", es: "ES", pt: "PT",
  dk: "DK", no: "NO", se: "SE", cz: "CZ", pl: "PL", ro: "RO", hu: "HU", tr: "TR", uk: "GB", ie: "IE", lu: "LU",
};

const LANGUAGE: Record<string, string> = {
  NL: "nl", BE: "nl", DE: "de", AT: "de", CH: "de", LU: "de", FR: "fr", IT: "it", ES: "es", PT: "pt",
  DK: "da", NO: "no", SE: "sv", CZ: "cs", PL: "pl", RO: "ro", HU: "hu", TR: "tr", GB: "en", IE: "en",
};

export const countryName = (code?: string | null): string =>
  COUNTRIES.find((c) => c.code === code)?.name || "";

export const detectCountry = (address?: string | null, email?: string | null): string | null => {
  const text = ` ${(address || "").toLowerCase().replace(/[\t,()]/g, " ").replace(/\s+/g, " ")} `;
  for (const c of COUNTRIES) {
    if (c.words.some((w) => {
      const word = w.trim();
      return new RegExp(`(^|[^\\p{L}])${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\p{L}]|$)`, "u").test(text);
    })) return c.code;
  }
  const tld = (email || "").toLowerCase().trim().split(".").pop() || "";
  return TLD[tld] || null;
};

/** Invoice language for a country code; English when unknown. */
export const languageForCountry = (code?: string | null): string => (code && LANGUAGE[code]) || "en";

/** Country code, country name and invoice language for an order. */
export const orderLocale = (order: { company_address?: string | null; contact_email?: string | null }) => {
  const code = detectCountry(order.company_address, order.contact_email);
  return { code, country: countryName(code), language: languageForCountry(code) };
};
