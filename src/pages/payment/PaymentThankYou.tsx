import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { CheckCircle2, Loader2, AlertCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { nextSteps, receiptState, type Receipt } from "./receiptView";

type Lang = "de" | "en";
const LANG_KEY = "client_login_lang";
const CONTACT = "invoice@mediaamarketing.com · +49 203 7090 1754";

const T = {
  de: {
    title: "Zahlung erhalten", confirming: "Ihre Zahlung wird bestätigt…", confirmingDesc: "Das dauert meist nur wenige Sekunden.",
    notFound: "Wir konnten diese Zahlung nicht finden", notFoundDesc: "Falls Sie bezahlt haben, ist alles in Ordnung – wir prüfen es gerne für Sie.",
    error: "Die Zahlung konnte gerade nicht geladen werden.", retry: "Erneut versuchen",
    thanks: "Vielen Dank! Ihre Zahlung ist bei uns eingegangen.", details: "Zahlungsdetails", item: "Leistung", amount: "Betrag",
    date: "Datum", reference: "Zahlungsreferenz", invoice: "Rechnungsnummer", next: "Wie geht es weiter?",
    email: "Eine Bestätigung ist per E-Mail unterwegs.", orderTeam: "Unser Team wurde informiert und setzt Ihren Auftrag fort.",
    packageActive: "Ihr Paket ist jetzt aktiv.", packageNext: "Ihr Paket ist aktiv. Die nächste Abbuchung erfolgt am {date}.",
    contact: `Fragen? ${CONTACT}`, portal: "Kundenportal öffnen", receipt: "Beleg herunterladen", payment: "Zahlung",
  },
  en: {
    title: "Payment received", confirming: "Confirming your payment…", confirmingDesc: "This usually takes just a few seconds.",
    notFound: "We couldn't find this payment", notFoundDesc: "If you've paid, everything is fine – we're happy to check it for you.",
    error: "The payment couldn't be loaded right now.", retry: "Try again",
    thanks: "Thank you! We've received your payment.", details: "Payment details", item: "Item", amount: "Amount",
    date: "Date", reference: "Payment reference", invoice: "Invoice number", next: "What happens next?",
    email: "A confirmation email is on its way.", orderTeam: "Our team has been notified and will continue with your order.",
    packageActive: "Your package is now active.", packageNext: "Your package is active. The next charge is on {date}.",
    contact: `Questions? ${CONTACT}`, portal: "Open client portal", receipt: "Download receipt", payment: "Payment",
  },
} as const;

const initialLang = (): Lang => {
  const s = localStorage.getItem(LANG_KEY);
  if (s === "de" || s === "en") return s;
  return navigator.language?.toLowerCase().startsWith("en") ? "en" : "de";
};

const PaymentThankYou = () => {
  const [params] = useSearchParams();
  const sid = params.get("session_id") ?? "";
  const [lang, setLang] = useState<Lang>(initialLang);
  const [r, setR] = useState<Receipt | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [failed, setFailed] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const tries = useRef(0);
  const t = T[lang];

  const load = async () => {
    if (!sid) { setNotFound(true); return; }
    setFailed(false);
    const { data, error } = await supabase.functions.invoke("payment-receipt", { body: { session_id: sid } });
    if (error) {
      const status = (error as { context?: { status?: number } }).context?.status;
      if (status === 404) setNotFound(true); else setFailed(true);
      return;
    }
    setR(data as Receipt);
    if (!(data as Receipt).paid) {
      tries.current += 1;
      if (tries.current >= 10) setGaveUp(true); else setTimeout(load, 3000);
    }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [sid]);

  const switchLang = (l: Lang) => { setLang(l); localStorage.setItem(LANG_KEY, l); };
  const state = receiptState(r, { loading: !r, notFound, failed, gaveUp });
  const locale = lang === "de" ? "de-DE" : "en-GB";
  const day = (d: string) => new Date(d).toLocaleDateString(locale, { day: "2-digit", month: "long", year: "numeric" });
  const money = (n: number, c: string) => new Intl.NumberFormat("de-DE", { style: "currency", currency: c }).format(n);

  return (
    <div className="min-h-screen bg-muted/30 flex items-start sm:items-center justify-center p-4 py-10">
      <Helmet>
        <title>{t.title} | Media Marketing</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="w-full max-w-lg space-y-4">
        <div className="flex justify-end gap-1">
          {(["de", "en"] as const).map((l) => (
            <Button key={l} size="sm" variant={lang === l ? "default" : "ghost"} onClick={() => switchLang(l)}>{l.toUpperCase()}</Button>
          ))}
        </div>
        <Card>
          <CardContent className="p-6 sm:p-8 space-y-6">
            {(state === "loading" || state === "confirming") && (
              <div className="text-center space-y-3 py-6" data-testid="receipt-confirming">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                <h1 className="text-2xl font-bold text-foreground">{t.confirming}</h1>
                <p className="text-muted-foreground">{t.confirmingDesc}</p>
              </div>
            )}
            {(state === "notFound" || state === "error") && (
              <div className="text-center space-y-3 py-6" data-testid="receipt-not-found">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
                <h1 className="text-2xl font-bold text-foreground">{state === "error" ? t.error : t.notFound}</h1>
                {state === "notFound" && <p className="text-muted-foreground">{t.notFoundDesc}</p>}
                <p className="text-sm text-muted-foreground break-words">{CONTACT}</p>
                {state === "error" && <Button onClick={load}>{t.retry}</Button>}
              </div>
            )}
            {state === "paid" && r && (
              <div className="space-y-6" data-testid="receipt-paid">
                <div className="text-center space-y-2">
                  <CheckCircle2 className="h-14 w-14 text-success mx-auto" />
                  <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
                  <p className="text-muted-foreground">{t.thanks}</p>
                </div>
                <div className="rounded-lg border divide-y text-sm">
                  <p className="px-4 py-2 font-semibold text-foreground">{t.details}</p>
                  {[
                    [t.item, r.title || t.payment],
                    [t.amount, money(r.amount, r.currency)],
                    [t.date, day(r.date)],
                    [t.reference, r.reference],
                    ...(r.invoice_number ? [[t.invoice, r.invoice_number]] : []),
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 px-4 py-2">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-medium text-foreground text-right break-words min-w-0">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-foreground">{t.next}</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                    {nextSteps(r).map((s) => (
                      <li key={s} className="break-words">{s === "packageNext" && r.next_charge ? t.packageNext.replace("{date}", day(r.next_charge)) : t[s as keyof typeof t]}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button asChild className="flex-1"><Link to="/client/login">{t.portal}</Link></Button>
                  {r.receipt_url && (
                    <Button asChild variant="outline" className="flex-1">
                      <a href={r.receipt_url} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4 mr-2" />{t.receipt}</a>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground">Media Marketing</p>
      </div>
    </div>
  );
};

export default PaymentThankYou;
