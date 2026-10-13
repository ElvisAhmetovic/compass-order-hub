import { describe, it, expect } from "vitest";
import { detectCountry, languageForCountry, orderLocale } from "../countryLanguage";
import { resolveOrderClient } from "@/services/orderClientResolver";

describe("country from order address", () => {
  const cases: [string, string, string][] = [
    ["Via Savona, 94, 20144 Milano MI, Italy", "info@arredatutto.com", "IT"],
    ["13 rue du Nouveau Bêle\t44470\tCARQUEFOU France (Metropolitan)", "", "FR"],
    ["23 Rue des Lombards\t75004\tParis, Frankreich", "", "FR"],
    ["Rijksstraatweg 63-A, 1969 LC Heemskerk, Niederlande", "", "NL"],
    ["Calmbergstr. 15  \t86159\tAugsburg Deutschland", "", "DE"],
    ["Rosenørns Alle 31, 2, 1970 Frederiksberg, Dänemark", "", "DK"],
    ["Samota 850, 382 41 Kaplice 1, Czechia", "", "CZ"],
    ["Chertsey Street Guildford\tGU1 4HD\tEngland", "", "GB"],
    ["Rue de Cornavin\t1201\tGeneva, Switzerland", "", "CH"],
    ["Energieweg 10c 5145 NW Waalwijk", "Info@wmautomotive.nl", "NL"],
    ["Goethestrasse 20, 8001 Zürich", "info@drkisner.ch", "CH"],
  ];
  for (const [addr, email, code] of cases) it(addr, () => expect(detectCountry(addr, email)).toBe(code));
  it("unknown falls back to English", () => expect(orderLocale({ company_address: "Somewhere", contact_email: "a@b.com" }).language).toBe("en"));
  it("maps languages", () => {
    expect(languageForCountry("IT")).toBe("it");
    expect(languageForCountry("NL")).toBe("nl");
    expect(languageForCountry("BE")).toBe("nl");
    expect(languageForCountry("AT")).toBe("de");
    expect(languageForCountry("DK")).toBe("da");
  });
});

describe("client for an order", () => {
  const clients = [
    { id: "a", name: "Arredatutto.com", email: "info@arredatutto.com" },
    { id: "m", name: "IK Monheimer Grundbesitz GmbH", email: "schlosskellerlauf@web.de" },
  ];
  it("same email but different company makes a new client", () =>
    expect(resolveOrderClient(clients, { company_name: "Bauhöfer's Bierdeckel", contact_email: "schlosskellerlauf@web.de" })).toBeUndefined());
  it("same name and email reuses the client", () =>
    expect(resolveOrderClient(clients, { company_name: "Arredatutto.com", contact_email: "info@arredatutto.com" })).toBe("a"));
  it("never picks another company's client", () =>
    expect(resolveOrderClient(clients, { company_name: "PC Portable", contact_email: "contact@pc-portable.net" })).toBeUndefined());
});
