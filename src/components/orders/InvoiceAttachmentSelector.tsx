import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { FileText, X, ChevronsUpDown, Loader2, Paperclip } from "lucide-react";
import { formatCurrency } from "@/utils/currencyUtils";

export interface SelectedInvoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  currency: string;
  issue_date: string;
  client_name: string;
}

interface InvoiceAttachmentSelectorProps {
  selectedInvoice: SelectedInvoice | null;
  onSelect: (invoice: SelectedInvoice | null) => void;
  disabled?: boolean;
}

const InvoiceAttachmentSelector = ({ selectedInvoice, onSelect, disabled }: InvoiceAttachmentSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [invoices, setInvoices] = useState<SelectedInvoice[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && invoices.length === 0) {
      fetchInvoices();
    }
  }, [open]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, invoice_number, total_amount, currency, issue_date, client_id, clients(name)")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      const mapped: SelectedInvoice[] = (data || []).map((inv: any) => ({
        id: inv.id,
        invoice_number: inv.invoice_number,
        total_amount: inv.total_amount,
        currency: inv.currency,
        issue_date: inv.issue_date,
        client_name: inv.clients?.name || "Unknown",
      }));
      setInvoices(mapped);
    } catch (err) {
      console.error("Error fetching invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (selectedInvoice) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">Invoice Attachment</label>
        <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50">
          <Paperclip className="h-4 w-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {selectedInvoice.invoice_number} — {selectedInvoice.client_name}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(selectedInvoice.total_amount, selectedInvoice.currency)} · {formatDate(selectedInvoice.issue_date)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => onSelect(null)}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Invoice Attachment (Optional)</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between text-muted-foreground"
            disabled={disabled}
          >
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Attach an invoice PDF...
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search by invoice number or client..." />
            <CommandList>
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                <>
                  <CommandEmpty>No invoices found.</CommandEmpty>
                  <CommandGroup>
                    {invoices.map((inv) => (
                      <CommandItem
                        key={inv.id}
                        value={`${inv.invoice_number} ${inv.client_name}`}
                        onSelect={() => {
                          onSelect(inv);
                          setOpen(false);
                        }}
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-sm">
                            {inv.invoice_number} — {inv.client_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatCurrency(inv.total_amount, inv.currency)} · {formatDate(inv.issue_date)}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default InvoiceAttachmentSelector;
