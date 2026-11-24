import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Mail } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { InvoiceService } from "@/services/invoiceService";
import { generateInvoicePDF } from "@/utils/invoicePdfGenerator";
import SendInvoicePDFDialog from "@/components/invoices/SendInvoicePDFDialog";
import type { Client, Invoice, InvoiceLineItem } from "@/types/invoice";

type Loaded = { invoice: Invoice; lineItems: InvoiceLineItem[]; client?: Client; templateSettings: Record<string, unknown> };

/** Uses the same PDF generator and send dialog as the Invoices page, so bank details match. */
export function InvoiceResultActions({ invoiceId }: { invoiceId: string }) {
  const [busy, setBusy] = useState<"pdf" | "send" | null>(null);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [sendOpen, setSendOpen] = useState(false);

  const load = async (): Promise<Loaded> => {
    if (loaded) return loaded;
    const invoice = await InvoiceService.getInvoice(invoiceId);
    if (!invoice) throw new Error("Invoice not found");
    const [lineItems, client] = await Promise.all([
      InvoiceService.getLineItems(invoice.id),
      invoice.client_id ? InvoiceService.getClient(invoice.client_id) : Promise.resolve(null),
    ]);
    const { loadInvoiceTemplateSettings } = await import("@/components/invoices/loadTemplateSettings");
    const base = (await loadInvoiceTemplateSettings()) as Record<string, unknown>;
    const lang = (invoice as Invoice & { language?: string }).language;
    const templateSettings = { ...base, ...(lang ? { language: lang } : {}), customTerms: (invoice as Invoice & { custom_terms?: string }).custom_terms || "", currency: invoice.currency };
    const l = { invoice, lineItems, client: client || undefined, templateSettings };
    setLoaded(l);
    return l;
  };

  const run = async (kind: "pdf" | "send") => {
    setBusy(kind);
    try {
      const l = await load();
      if (kind === "pdf") await generateInvoicePDF({ invoice: l.invoice, lineItems: l.lineItems, client: l.client, templateSettings: l.templateSettings, formData: { currency: l.invoice.currency } } as never);
      else setSendOpen(true);
    } catch (e) {
      toast({ title: "Could not load invoice", description: (e as Error).message, variant: "destructive" });
    } finally { setBusy(null); }
  };

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <Button size="sm" variant="outline" disabled={!!busy} onClick={() => run("pdf")}>{busy === "pdf" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Download className="mr-1 h-3 w-3" />}Download PDF</Button>
      <Button size="sm" variant="outline" disabled={!!busy} onClick={() => run("send")}>{busy === "send" ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Mail className="mr-1 h-3 w-3" />}Send to client</Button>
      {loaded && (
        <SendInvoicePDFDialog open={sendOpen} onOpenChange={setSendOpen} invoice={loaded.invoice} lineItems={loaded.lineItems} client={loaded.client}
          templateSettings={loaded.templateSettings} formData={{ currency: loaded.invoice.currency, stripe_payment_link: (loaded.invoice as Invoice & { stripe_payment_link?: string }).stripe_payment_link }} />
      )}
    </div>
  );
}
