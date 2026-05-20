// Shared translations for invoice PDF, live preview, and payment-info panel.
// Add new language codes here and they automatically apply everywhere.

export type LangCode = string;

const EN_ACCOUNTS = { belgium: "Belgian Bank Account", germany: "German Bank Account", uk: "UK Bank Account (Wise)" };
export const ACCOUNT_NAME_TRANSLATIONS: Record<string, { belgium: string; germany: string; uk: string }> = {
  en: EN_ACCOUNTS,
  de: { belgium: "Belgisches Bankkonto", germany: "Deutsches Bankkonto", uk: "Britisches Bankkonto (Wise)" },
  fr: { belgium: "Compte bancaire belge", germany: "Compte bancaire allemand", uk: "Compte bancaire britannique (Wise)" },
  nl: { belgium: "Bankrekening België", germany: "Duitse Bankrekening", uk: "Britse Bankrekening (Wise)" },
  es: { belgium: "Cuenta bancaria belga", germany: "Cuenta bancaria alemana", uk: "Cuenta bancaria británica (Wise)" },
  da: { belgium: "Belgisk bankkonto", germany: "Tysk bankkonto", uk: "Britisk bankkonto (Wise)" },
  no: { belgium: "Belgisk bankkonto", germany: "Tysk bankkonto", uk: "Britisk bankkonto (Wise)" },
  cs: { belgium: "Belgický bankovní účet", germany: "Německý bankovní účet", uk: "Britský bankovní účet (Wise)" },
  pl: { belgium: "Belgijskie konto bankowe", germany: "Niemieckie konto bankowe", uk: "Brytyjskie konto bankowe (Wise)" },
  sv: { belgium: "Belgiskt bankkonto", germany: "Tyskt bankkonto", uk: "Brittiskt bankkonto (Wise)" },
  ru: { belgium: "Бельгийский банковский счёт", germany: "Немецкий банковский счёт", uk: "Британский банковский счёт (Wise)" },
  it: { belgium: "Conto bancario belga", germany: "Conto bancario tedesco", uk: "Conto bancario britannico (Wise)" },
  uk: { belgium: "Бельгійський банківський рахунок", germany: "Німецький банківський рахунок", uk: "Британський банківський рахунок (Wise)" },
  ro: { belgium: "Cont bancar belgian", germany: "Cont bancar german", uk: "Cont bancar britanic (Wise)" },
  tr: { belgium: "Belçika Banka Hesabı", germany: "Almanya Banka Hesabı", uk: "Birleşik Krallık Banka Hesabı (Wise)" },
  pt: { belgium: "Conta bancária belga", germany: "Conta bancária alemã", uk: "Conta bancária britânica (Wise)" },
  hu: { belgium: "Belga bankszámla", germany: "Német bankszámla", uk: "Brit bankszámla (Wise)" },
  el: { belgium: "Βελγικός τραπεζικός λογαριασμός", germany: "Γερμανικός τραπεζικός λογαριασμός", uk: "Βρετανικός τραπεζικός λογαριασμός (Wise)" },
  bg: { belgium: "Белгийска банкова сметка", germany: "Германска банкова сметка", uk: "Британска банкова сметка (Wise)" },
  fi: { belgium: "Belgialainen pankkitili", germany: "Saksalainen pankkitili", uk: "Brittiläinen pankkitili (Wise)" },
  sk: { belgium: "Belgický bankový účet", germany: "Nemecký bankový účet", uk: "Britský bankový účet (Wise)" },
  sl: { belgium: "Belgijski bančni račun", germany: "Nemški bančni račun", uk: "Britanski bančni račun (Wise)" },
  mk: { belgium: "Белгиска банкарска сметка", germany: "Германска банкарска сметка", uk: "Британска банкарска сметка (Wise)" },
};

export function getAccountName(language: string, accountId: "belgium" | "germany" | "uk"): string {
  const lang = language || "en";
  return ACCOUNT_NAME_TRANSLATIONS[lang]?.[accountId] || EN_ACCOUNTS[accountId];
}

type LineItemKey =
  | "Sample Service" | "Consulting" | "Design Work" | "Development" | "Web Development"
  | "Marketing" | "Training" | "Support" | "Maintenance" | "License";

const LINE_ITEMS: Record<LineItemKey, Record<string, string>> = {
  "Sample Service": { en: "Sample Service", de: "Beispielservice", fr: "Service d'exemple", nl: "Voorbeelddienst", es: "Servicio de muestra", da: "Eksempeltjeneste", no: "Eksempeltjeneste", cs: "Ukázková služba", pl: "Przykładowa usługa", sv: "Exempeltjänst", ru: "Образец услуги", it: "Servizio di esempio", uk: "Зразок послуги", ro: "Serviciu exemplu", tr: "Örnek Hizmet", pt: "Serviço de exemplo", hu: "Mintaszolgáltatás", el: "Δείγμα υπηρεσίας", bg: "Примерна услуга", fi: "Esimerkkipalvelu", sk: "Ukážková služba", sl: "Vzorčna storitev", mk: "Примерна услуга" },
  "Consulting": { en: "Consulting", de: "Beratung", fr: "Consultation", nl: "Consultancy", es: "Consultoría", da: "Rådgivning", no: "Rådgivning", cs: "Poradenství", pl: "Doradztwo", sv: "Rådgivning", ru: "Консалтинг", it: "Consulenza", uk: "Консалтинг", ro: "Consultanță", tr: "Danışmanlık", pt: "Consultoria", hu: "Tanácsadás", el: "Συμβουλευτική", bg: "Консултации", fi: "Konsultointi", sk: "Poradenstvo", sl: "Svetovanje", mk: "Консалтинг" },
  "Design Work": { en: "Design Work", de: "Designarbeit", fr: "Travail de conception", nl: "Ontwerpwerk", es: "Trabajo de diseño", da: "Designarbejde", no: "Designarbeid", cs: "Designová práce", pl: "Praca projektowa", sv: "Designarbete", ru: "Дизайн-работа", it: "Lavoro di design", uk: "Дизайнерська робота", ro: "Lucrări de design", tr: "Tasarım Çalışması", pt: "Trabalho de design", hu: "Tervezési munka", el: "Εργασία σχεδιασμού", bg: "Дизайнерска работа", fi: "Suunnittelutyö", sk: "Dizajnérska práca", sl: "Oblikovalsko delo", mk: "Дизајнерска работа" },
  "Development": { en: "Development", de: "Entwicklung", fr: "Développement", nl: "Ontwikkeling", es: "Desarrollo", da: "Udvikling", no: "Utvikling", cs: "Vývoj", pl: "Rozwój", sv: "Utveckling", ru: "Разработка", it: "Sviluppo", uk: "Розробка", ro: "Dezvoltare", tr: "Geliştirme", pt: "Desenvolvimento", hu: "Fejlesztés", el: "Ανάπτυξη", bg: "Разработка", fi: "Kehitys", sk: "Vývoj", sl: "Razvoj", mk: "Развој" },
  "Web Development": { en: "Web Development", de: "Webentwicklung", fr: "Développement web", nl: "Webontwikkeling", es: "Desarrollo web", da: "Webudvikling", no: "Webutvikling", cs: "Vývoj webu", pl: "Rozwój stron internetowych", sv: "Webbutveckling", ru: "Веб-разработка", it: "Sviluppo web", uk: "Веб-розробка", ro: "Dezvoltare web", tr: "Web Geliştirme", pt: "Desenvolvimento web", hu: "Webfejlesztés", el: "Ανάπτυξη ιστού", bg: "Уеб разработка", fi: "Verkkokehitys", sk: "Vývoj webu", sl: "Spletni razvoj", mk: "Веб развој" },
  "Marketing": { en: "Marketing", de: "Marketing", fr: "Marketing", nl: "Marketing", es: "Marketing", da: "Marketing", no: "Markedsføring", cs: "Marketing", pl: "Marketing", sv: "Marknadsföring", ru: "Маркетинг", it: "Marketing", uk: "Маркетинг", ro: "Marketing", tr: "Pazarlama", pt: "Marketing", hu: "Marketing", el: "Μάρκετινγκ", bg: "Маркетинг", fi: "Markkinointi", sk: "Marketing", sl: "Trženje", mk: "Маркетинг" },
  "Training": { en: "Training", de: "Schulung", fr: "Formation", nl: "Training", es: "Formación", da: "Træning", no: "Trening", cs: "Školení", pl: "Szkolenie", sv: "Utbildning", ru: "Обучение", it: "Formazione", uk: "Навчання", ro: "Instruire", tr: "Eğitim", pt: "Formação", hu: "Képzés", el: "Εκπαίδευση", bg: "Обучение", fi: "Koulutus", sk: "Školenie", sl: "Usposabljanje", mk: "Обука" },
  "Support": { en: "Support", de: "Support", fr: "Assistance", nl: "Ondersteuning", es: "Soporte", da: "Support", no: "Støtte", cs: "Podpora", pl: "Wsparcie", sv: "Support", ru: "Поддержка", it: "Supporto", uk: "Підтримка", ro: "Suport", tr: "Destek", pt: "Suporte", hu: "Támogatás", el: "Υποστήριξη", bg: "Поддръжка", fi: "Tuki", sk: "Podpora", sl: "Podpora", mk: "Поддршка" },
  "Maintenance": { en: "Maintenance", de: "Wartung", fr: "Maintenance", nl: "Onderhoud", es: "Mantenimiento", da: "Vedligeholdelse", no: "Vedlikehold", cs: "Údržba", pl: "Konserwacja", sv: "Underhåll", ru: "Обслуживание", it: "Manutenzione", uk: "Обслуговування", ro: "Întreținere", tr: "Bakım", pt: "Manutenção", hu: "Karbantartás", el: "Συντήρηση", bg: "Поддръжка", fi: "Ylläpito", sk: "Údržba", sl: "Vzdrževanje", mk: "Одржување" },
  "License": { en: "License", de: "Lizenz", fr: "Licence", nl: "Licentie", es: "Licencia", da: "Licens", no: "Lisens", cs: "Licence", pl: "Licencja", sv: "Licens", ru: "Лицензия", it: "Licenza", uk: "Ліцензія", ro: "Licență", tr: "Lisans", pt: "Licença", hu: "Licenc", el: "Άδεια", bg: "Лиценз", fi: "Lisenssi", sk: "Licencia", sl: "Licenca", mk: "Лиценца" },
};

export function translateLineItem(description: string, language: string): string {
  const lang = language || "en";
  const entry = (LINE_ITEMS as Record<string, Record<string, string>>)[description];
  if (entry) return entry[lang] || entry.en || description;
  return description;
}

type InvoiceLabelKey =
  | "date" | "dueDate" | "balanceDue" | "billTo" | "item" | "quantity" | "rate"
  | "amount" | "subtotal" | "tax" | "total" | "notes" | "bankDetails" | "iban"
  | "bic" | "blz" | "account" | "bank" | "contactPerson" | "companyRegistrationNumber" | "uidNumber";

type LabelMap = Record<InvoiceLabelKey, string>;

const INVOICE_LABELS: Record<string, LabelMap> = {
  en: { date: "Date:", dueDate: "Due Date:", balanceDue: "Balance Due:", billTo: "Bill To:", item: "Item", quantity: "Quantity", rate: "Rate", amount: "Amount", subtotal: "Subtotal:", tax: "Tax", total: "Total:", notes: "Notes:", bankDetails: "Bank Details:", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "ACCOUNT", bank: "Bank", contactPerson: "Contact Person:", companyRegistrationNumber: "Company Registration Number:", uidNumber: "UID- Number:" },
  de: { date: "Datum:", dueDate: "Fälligkeitsdatum:", balanceDue: "Saldo:", billTo: "Rechnung an:", item: "Artikel", quantity: "Menge", rate: "Preis", amount: "Betrag", subtotal: "Zwischensumme:", tax: "MwSt", total: "Gesamt:", notes: "Notizen:", bankDetails: "Bankverbindung:", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "KONTO", bank: "Bank", contactPerson: "Ansprechpartner:", companyRegistrationNumber: "Firmenregistrierungsnummer:", uidNumber: "UID-Nummer:" },
  fr: { date: "Date:", dueDate: "Date d'échéance:", balanceDue: "Solde dû:", billTo: "Facturer à:", item: "Article", quantity: "Quantité", rate: "Taux", amount: "Montant", subtotal: "Sous-total:", tax: "TVA", total: "Total:", notes: "Notes:", bankDetails: "Coordonnées bancaires:", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "COMPTE", bank: "Banque", contactPerson: "Personne de contact:", companyRegistrationNumber: "Numéro d'enregistrement de l'entreprise:", uidNumber: "Numéro UID:" },
  nl: { date: "Datum:", dueDate: "Vervaldatum:", balanceDue: "Saldo:", billTo: "Factuur aan:", item: "Item", quantity: "Aantal", rate: "Tarief", amount: "Bedrag", subtotal: "Subtotaal:", tax: "BTW", total: "Totaal:", notes: "Opmerkingen:", bankDetails: "Bankgegevens:", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "REKENING", bank: "Bank", contactPerson: "Contactpersoon:", companyRegistrationNumber: "Bedrijfsregistratienummer:", uidNumber: "UID-nummer:" },
  es: { date: "Fecha:", dueDate: "Fecha de vencimiento:", balanceDue: "Saldo pendiente:", billTo: "Facturar a:", item: "Artículo", quantity: "Cantidad", rate: "Precio", amount: "Importe", subtotal: "Subtotal:", tax: "IVA", total: "Total:", notes: "Notas:", bankDetails: "Datos bancarios:", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "CUENTA", bank: "Banco", contactPerson: "Persona de contacto:", companyRegistrationNumber: "Número de registro de la empresa:", uidNumber: "Número UID:" },
  da: { date: "Dato:", dueDate: "Forfaldsdato:", balanceDue: "Resterende saldo:", billTo: "Faktureres til:", item: "Vare", quantity: "Antal", rate: "Pris", amount: "Beløb", subtotal: "Subtotal:", tax: "Moms", total: "Total:", notes: "Noter:", bankDetails: "Bankoplysninger:", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "KONTO", bank: "Bank", contactPerson: "Kontaktperson:", companyRegistrationNumber: "Virksomhedsregistreringsnummer:", uidNumber: "UID-nummer:" },
  no: { date: "Dato:", dueDate: "Forfallsdato:", balanceDue: "Gjenstående saldo:", billTo: "Faktureres til:", item: "Vare", quantity: "Antall", rate: "Pris", amount: "Beløp", subtotal: "Subtotal:", tax: "MVA", total: "Total:", notes: "Notater:", bankDetails: "Bankdetaljer:", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "KONTO", bank: "Bank", contactPerson: "Kontaktperson:", companyRegistrationNumber: "Selskapsregistreringsnummer:", uidNumber: "UID-nummer:" },
  cs: { date: "Datum:", dueDate: "Datum splatnosti:", balanceDue: "Zbývající zůstatek:", billTo: "Fakturovat na:", item: "Položka", quantity: "Množství", rate: "Cena", amount: "Částka", subtotal: "Mezisoučet:", tax: "DPH", total: "Celkem:", notes: "Poznámky:", bankDetails: "Bankovní údaje:", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "ÚČET", bank: "Banka", contactPerson: "Kontaktní osoba:", companyRegistrationNumber: "Registrační číslo společnosti:", uidNumber: "UID číslo:" },
  pl: { date: "Data:", dueDate: "Termin płatności:", balanceDue: "Pozostałe saldo:", billTo: "Fakturować do:", item: "Pozycja", quantity: "Ilość", rate: "Cena", amount: "Kwota", subtotal: "Suma częściowa:", tax: "VAT", total: "Razem:", notes: "Uwagi:", bankDetails: "Dane bankowe:", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "KONTO", bank: "Bank", contactPerson: "Osoba kontaktowa:", companyRegistrationNumber: "Numer rejestracji firmy:", uidNumber: "Numer UID:" },
  sv: { date: "Datum:", dueDate: "Förfallodatum:", balanceDue: "Återstående saldo:", billTo: "Fakturera till:", item: "Artikel", quantity: "Antal", rate: "Pris", amount: "Belopp", subtotal: "Delsumma:", tax: "Moms", total: "Totalt:", notes: "Anteckningar:", bankDetails: "Bankuppgifter:", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "KONTO", bank: "Bank", contactPerson: "Kontaktperson:", companyRegistrationNumber: "Företagsregistreringsnummer:", uidNumber: "UID-nummer:" },
  ru: { date: "Дата:", dueDate: "Срок оплаты:", balanceDue: "К оплате:", billTo: "Получатель счёта:", item: "Наименование", quantity: "Кол-во", rate: "Цена", amount: "Сумма", subtotal: "Промежуточный итог:", tax: "НДС", total: "Итого:", notes: "Примечания:", bankDetails: "Банковские реквизиты:", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "СЧЁТ", bank: "Банк", contactPerson: "Контактное лицо:", companyRegistrationNumber: "Регистрационный номер компании:", uidNumber: "UID-номер:" },
  it: { date: "Data:", dueDate: "Data di scadenza:", balanceDue: "Saldo dovuto:", billTo: "Fatturare a:", item: "Articolo", quantity: "Quantità", rate: "Prezzo", amount: "Importo", subtotal: "Subtotale:", tax: "IVA", total: "Totale:", notes: "Note:", bankDetails: "Dati bancari:", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "CONTO", bank: "Banca", contactPerson: "Persona di contatto:", companyRegistrationNumber: "Numero di registrazione aziendale:", uidNumber: "Numero UID:" },
  uk: { date: "Дата:", dueDate: "Термін сплати:", balanceDue: "До сплати:", billTo: "Кому виставлено рахунок:", item: "Найменування", quantity: "Кількість", rate: "Ціна", amount: "Сума", subtotal: "Проміжний підсумок:", tax: "ПДВ", total: "Разом:", notes: "Примітки:", bankDetails: "Банківські реквізити:", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "РАХУНОК", bank: "Банк", contactPerson: "Контактна особа:", companyRegistrationNumber: "Реєстраційний номер компанії:", uidNumber: "UID-номер:" },
  ro: { date: "Data:", dueDate: "Data scadenței:", balanceDue: "Sold de plată:", billTo: "Facturat către:", item: "Articol", quantity: "Cantitate", rate: "Preț", amount: "Sumă", subtotal: "Subtotal:", tax: "TVA", total: "Total:", notes: "Note:", bankDetails: "Date bancare:", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "CONT", bank: "Bancă", contactPerson: "Persoană de contact:", companyRegistrationNumber: "Număr de înregistrare al companiei:", uidNumber: "Număr UID:" },
  tr: { date: "Tarih:", dueDate: "Son Ödeme Tarihi:", balanceDue: "Ödenecek Tutar:", billTo: "Fatura Edilen:", item: "Kalem", quantity: "Adet", rate: "Birim Fiyat", amount: "Tutar", subtotal: "Ara Toplam:", tax: "KDV", total: "Toplam:", notes: "Notlar:", bankDetails: "Banka Bilgileri:", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "HESAP", bank: "Banka", contactPerson: "İletişim Kişisi:", companyRegistrationNumber: "Şirket Tescil Numarası:", uidNumber: "UID Numarası:" },
  pt: { date: "Data:", dueDate: "Data de vencimento:", balanceDue: "Saldo devido:", billTo: "Faturar para:", item: "Item", quantity: "Quantidade", rate: "Preço", amount: "Valor", subtotal: "Subtotal:", tax: "IVA", total: "Total:", notes: "Notas:", bankDetails: "Dados bancários:", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "CONTA", bank: "Banco", contactPerson: "Pessoa de contacto:", companyRegistrationNumber: "Número de registo da empresa:", uidNumber: "Número UID:" },
  hu: { date: "Dátum:", dueDate: "Fizetési határidő:", balanceDue: "Fizetendő egyenleg:", billTo: "Számlázási cím:", item: "Tétel", quantity: "Mennyiség", rate: "Egységár", amount: "Összeg", subtotal: "Részösszeg:", tax: "ÁFA", total: "Összesen:", notes: "Megjegyzések:", bankDetails: "Banki adatok:", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "SZÁMLA", bank: "Bank", contactPerson: "Kapcsolattartó:", companyRegistrationNumber: "Cégjegyzékszám:", uidNumber: "UID-szám:" },
  el: { date: "Ημερομηνία:", dueDate: "Ημερομηνία λήξης:", balanceDue: "Οφειλόμενο υπόλοιπο:", billTo: "Χρέωση σε:", item: "Είδος", quantity: "Ποσότητα", rate: "Τιμή", amount: "Ποσό", subtotal: "Υποσύνολο:", tax: "ΦΠΑ", total: "Σύνολο:", notes: "Σημειώσεις:", bankDetails: "Στοιχεία τραπέζης:", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "ΛΟΓΑΡΙΑΣΜΟΣ", bank: "Τράπεζα", contactPerson: "Πρόσωπο επικοινωνίας:", companyRegistrationNumber: "Αριθμός μητρώου εταιρείας:", uidNumber: "Αριθμός UID:" },
  bg: { date: "Дата:", dueDate: "Падеж:", balanceDue: "Дължима сума:", billTo: "Фактуриран на:", item: "Артикул", quantity: "Количество", rate: "Цена", amount: "Сума", subtotal: "Междинна сума:", tax: "ДДС", total: "Общо:", notes: "Бележки:", bankDetails: "Банкови данни:", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "СМЕТКА", bank: "Банка", contactPerson: "Лице за контакт:", companyRegistrationNumber: "Регистрационен номер на фирмата:", uidNumber: "UID номер:" },
  fi: { date: "Päivämäärä:", dueDate: "Eräpäivä:", balanceDue: "Maksettava saldo:", billTo: "Laskutus:", item: "Tuote", quantity: "Määrä", rate: "Hinta", amount: "Summa", subtotal: "Välisumma:", tax: "ALV", total: "Yhteensä:", notes: "Huomautukset:", bankDetails: "Pankkitiedot:", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "TILI", bank: "Pankki", contactPerson: "Yhteyshenkilö:", companyRegistrationNumber: "Y-tunnus:", uidNumber: "UID-numero:" },
  sk: { date: "Dátum:", dueDate: "Dátum splatnosti:", balanceDue: "Zostávajúci zostatok:", billTo: "Fakturovať na:", item: "Položka", quantity: "Množstvo", rate: "Cena", amount: "Suma", subtotal: "Medzisúčet:", tax: "DPH", total: "Spolu:", notes: "Poznámky:", bankDetails: "Bankové údaje:", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "ÚČET", bank: "Banka", contactPerson: "Kontaktná osoba:", companyRegistrationNumber: "IČO spoločnosti:", uidNumber: "UID číslo:" },
  sl: { date: "Datum:", dueDate: "Datum zapadlosti:", balanceDue: "Preostali znesek:", billTo: "Račun za:", item: "Postavka", quantity: "Količina", rate: "Cena", amount: "Znesek", subtotal: "Vmesni seštevek:", tax: "DDV", total: "Skupaj:", notes: "Opombe:", bankDetails: "Bančni podatki:", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "RAČUN", bank: "Banka", contactPerson: "Kontaktna oseba:", companyRegistrationNumber: "Matična številka podjetja:", uidNumber: "UID-številka:" },
  mk: { date: "Датум:", dueDate: "Краен рок:", balanceDue: "Долг за плаќање:", billTo: "Фактурирано на:", item: "Ставка", quantity: "Количина", rate: "Цена", amount: "Износ", subtotal: "Меѓузбир:", tax: "ДДВ", total: "Вкупно:", notes: "Белешки:", bankDetails: "Банкарски детали:", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "СМЕТКА", bank: "Банка", contactPerson: "Лице за контакт:", companyRegistrationNumber: "Регистарски број на компанијата:", uidNumber: "UID-број:" },
};

export function getInvoiceLabel(language: string, key: InvoiceLabelKey): string {
  const lang = language || "en";
  return INVOICE_LABELS[lang]?.[key] || INVOICE_LABELS.en[key];
}

type PaymentPanelKey = "paymentAccount" | "iban" | "bic" | "blz" | "account" | "bank" | "bothAccounts" | "sortCode" | "accountNumber" | "address";
type PaymentPanelMap = Record<PaymentPanelKey, string>;

const PAYMENT_PANEL: Record<string, PaymentPanelMap> = {
  en: { paymentAccount: "Payment Account", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Account", bank: "Bank", bothAccounts: "All Accounts", sortCode: "Sort Code", accountNumber: "Account Number", address: "Address" },
  de: { paymentAccount: "Zahlungskonto", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Konto", bank: "Bank", bothAccounts: "Alle Konten", sortCode: "Bankleitzahl", accountNumber: "Kontonummer", address: "Adresse" },
  fr: { paymentAccount: "Compte de paiement", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Compte", bank: "Banque", bothAccounts: "Tous les comptes", sortCode: "Code guichet", accountNumber: "Numéro de compte", address: "Adresse" },
  nl: { paymentAccount: "Betaalrekening", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Rekening", bank: "Bank", bothAccounts: "Alle rekeningen", sortCode: "Sorteercode", accountNumber: "Rekeningnummer", address: "Adres" },
  es: { paymentAccount: "Cuenta de pago", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Cuenta", bank: "Banco", bothAccounts: "Todas las cuentas", sortCode: "Código de clasificación", accountNumber: "Número de cuenta", address: "Dirección" },
  da: { paymentAccount: "Betalingskonto", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Konto", bank: "Bank", bothAccounts: "Alle konti", sortCode: "Sorteringskode", accountNumber: "Kontonummer", address: "Adresse" },
  no: { paymentAccount: "Betalingskonto", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Konto", bank: "Bank", bothAccounts: "Alle kontoer", sortCode: "Sorteringskode", accountNumber: "Kontonummer", address: "Adresse" },
  cs: { paymentAccount: "Platební účet", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Účet", bank: "Banka", bothAccounts: "Všechny účty", sortCode: "Kód pobočky", accountNumber: "Číslo účtu", address: "Adresa" },
  pl: { paymentAccount: "Konto płatnicze", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Konto", bank: "Bank", bothAccounts: "Wszystkie konta", sortCode: "Kod oddziału", accountNumber: "Numer konta", address: "Adres" },
  sv: { paymentAccount: "Betalningskonto", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Konto", bank: "Bank", bothAccounts: "Alla konton", sortCode: "Clearingnummer", accountNumber: "Kontonummer", address: "Adress" },
  ru: { paymentAccount: "Платёжный счёт", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Счёт", bank: "Банк", bothAccounts: "Все счета", sortCode: "Sort Code", accountNumber: "Номер счёта", address: "Адрес" },
  it: { paymentAccount: "Conto di pagamento", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Conto", bank: "Banca", bothAccounts: "Tutti i conti", sortCode: "Sort Code", accountNumber: "Numero di conto", address: "Indirizzo" },
  uk: { paymentAccount: "Платіжний рахунок", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Рахунок", bank: "Банк", bothAccounts: "Усі рахунки", sortCode: "Sort Code", accountNumber: "Номер рахунку", address: "Адреса" },
  ro: { paymentAccount: "Cont de plată", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Cont", bank: "Bancă", bothAccounts: "Toate conturile", sortCode: "Sort Code", accountNumber: "Număr de cont", address: "Adresă" },
  tr: { paymentAccount: "Ödeme Hesabı", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Hesap", bank: "Banka", bothAccounts: "Tüm Hesaplar", sortCode: "Sort Code", accountNumber: "Hesap Numarası", address: "Adres" },
  pt: { paymentAccount: "Conta de pagamento", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Conta", bank: "Banco", bothAccounts: "Todas as contas", sortCode: "Sort Code", accountNumber: "Número de conta", address: "Endereço" },
  hu: { paymentAccount: "Fizetési számla", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Számla", bank: "Bank", bothAccounts: "Összes számla", sortCode: "Sort Code", accountNumber: "Számlaszám", address: "Cím" },
  el: { paymentAccount: "Λογαριασμός πληρωμής", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Λογαριασμός", bank: "Τράπεζα", bothAccounts: "Όλοι οι λογαριασμοί", sortCode: "Sort Code", accountNumber: "Αριθμός λογαριασμού", address: "Διεύθυνση" },
  bg: { paymentAccount: "Платежна сметка", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Сметка", bank: "Банка", bothAccounts: "Всички сметки", sortCode: "Sort Code", accountNumber: "Номер на сметка", address: "Адрес" },
  fi: { paymentAccount: "Maksutili", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Tili", bank: "Pankki", bothAccounts: "Kaikki tilit", sortCode: "Sort Code", accountNumber: "Tilinumero", address: "Osoite" },
  sk: { paymentAccount: "Platobný účet", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Účet", bank: "Banka", bothAccounts: "Všetky účty", sortCode: "Sort Code", accountNumber: "Číslo účtu", address: "Adresa" },
  sl: { paymentAccount: "Plačilni račun", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Račun", bank: "Banka", bothAccounts: "Vsi računi", sortCode: "Sort Code", accountNumber: "Številka računa", address: "Naslov" },
  mk: { paymentAccount: "Платежна сметка", iban: "IBAN", bic: "BIC", blz: "BLZ", account: "Сметка", bank: "Банка", bothAccounts: "Сите сметки", sortCode: "Sort Code", accountNumber: "Број на сметка", address: "Адреса" },
};

export function getPaymentPanelLabels(language: string): PaymentPanelMap {
  const lang = language || "en";
  return PAYMENT_PANEL[lang] || PAYMENT_PANEL.en;
}
