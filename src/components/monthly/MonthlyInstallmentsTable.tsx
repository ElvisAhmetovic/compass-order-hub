import React, { useState, useEffect } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Trash2, ChevronDown, ChevronRight, ExternalLink, FileText, Mail, Loader2, UserCheck, UserX, KeyRound } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  monthlyContractService, MonthlyContract, MonthlyInstallment,
} from "@/services/monthlyContractService";
import { InvoiceService } from "@/services/invoiceService";
import { Invoice, Client } from "@/types/invoice";
import { cn } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import SendMonthlyInvoiceDialog from "./SendMonthlyInvoiceDialog";
import CreateClientPortalModal from "@/components/dashboard/CreateClientPortalModal";
import { supabase } from "@/integrations/supabase/client";
import { enqueueNotification } from "@/utils/notificationQueue";

const getFrequencyLabel = (freq: number): string => {
  if (freq === 1) return "month";
  if (freq === 3) return "quarterly";
  if (freq === 6) return "every 6 months";
  return `every ${freq} months`;
};

const detectLanguageFromAddress = (address: string | null | undefined): string => {
  if (!address) return "en";
  const lower = address.toLowerCase();
  const map: [RegExp, string][] = [
    [/deutschland|germany/i, "de"],
    [/nederland|netherlands|holland/i, "nl"],
    [/france|frankreich|français/i, "fr"],
    [/españa|spain|spanien/i, "es"],
    [/danmark|denmark|dänemark/i, "da"],
    [/norge|norway|norwegen/i, "no"],
    [/česko|czech|tschech/i, "cs"],
    [/polska|poland|polen/i, "pl"],
    [/sverige|sweden|schweden/i, "sv"],
  ];
  for (const [regex, lang] of map) {
    if (regex.test(lower)) return lang;
  }
  return "en";
};

interface Props {
  contracts: MonthlyContract[];
  installments: MonthlyInstallment[];
  onRefresh: () => void;
  isAdmin: boolean;
  currentUserName?: string;
}

const MonthlyInstallmentsTable: React.FC<Props> = ({ contracts, installments, onRefresh, isAdmin, currentUserName }) => {
  const [expandedContracts, setExpandedContracts] = useState<Set<string>>(new Set());
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [togglingEmailIds, setTogglingEmailIds] = useState<Set<string>>(new Set());
  const [creatingInvoiceIds, setCreatingInvoiceIds] = useState<Set<string>>(new Set());
  const [createdInvoices, setCreatedInvoices] = useState<Record<string, Invoice>>({});
  const [matchedClients, setMatchedClients] = useState<Record<string, Client>>({});
  const [invoiceIdMap, setInvoiceIdMap] = useState<Record<string, string>>({});

  // Portal status
  const [portalStatuses, setPortalStatuses] = useState<Record<string, boolean>>({});
  const [portalModalContract, setPortalModalContract] = useState<MonthlyContract | null>(null);

  // Send dialog state
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendDialogData, setSendDialogData] = useState<{
    contract: MonthlyContract;
    installment: MonthlyInstallment;
    invoice: Invoice | null;
    client: Client | null;
    language: string;
  } | null>(null);

  // Load existing invoice_id links from installments
  useEffect(() => {
    const map: Record<string, string> = {};
    installments.forEach(inst => {
      if (inst.invoice_id) map[inst.id] = inst.invoice_id;
    });
    setInvoiceIdMap(map);
  }, [installments]);

  // Check portal statuses on mount/refresh
  useEffect(() => {
    const checkPortalStatuses = async () => {
      const uniqueEmails = [...new Set(contracts.map(c => c.client_email.toLowerCase()))];
      if (uniqueEmails.length === 0) return;

      try {
        const { data } = await supabase
          .from("app_users")
          .select("email")
          .eq("role", "client")
          .in("email", uniqueEmails);

        const existingEmails = new Set((data || []).map(u => u.email.toLowerCase()));
        const statuses: Record<string, boolean> = {};
        contracts.forEach(c => {
          statuses[c.id] = existingEmails.has(c.client_email.toLowerCase());
        });
        setPortalStatuses(statuses);
      } catch {
        // silently fail
      }
    };
    checkPortalStatuses();
  }, [contracts]);

  const handleCreateInvoice = async (contract: MonthlyContract, inst: MonthlyInstallment) => {
    // Duplicate guard
    if (invoiceIdMap[inst.id] || inst.invoice_id) {
      toast({ title: "Invoice already exists", description: "An invoice has already been created for this installment." });
      return;
    }
    setCreatingInvoiceIds(prev => new Set(prev).add(inst.id));
    try {
      const clients = await InvoiceService.getClients();
      let matched = clients.find(c => 
        c.email.toLowerCase() === contract.client_email.toLowerCase() &&
        c.name.toLowerCase() === contract.client_name.toLowerCase()
      );
      if (!matched) {
        matched = clients.find(c => c.email.toLowerCase() === contract.client_email.toLowerCase());
      }
      if (!matched) {
        matched = await InvoiceService.createClient({
          name: contract.client_name,
          email: contract.client_email,
          contact_person: contract.client_name,
          address: (contract as any).company_address || "",
          phone: (contract as any).contact_phone || "",
        });
        toast({ title: "Client auto-created", description: `Client "${contract.client_name}" was added to the invoice system.` });
      }

      const vatEnabled = !!contract.vat_enabled;
      const vatRate = vatEnabled ? (Number(contract.vat_rate) || 0) : 0;
      const grossPrice = inst.amount;
      const netPrice = vatRate > 0 ? grossPrice / (1 + vatRate) : grossPrice;
      const description = contract.description
        ? `${contract.description} - ${inst.month_label}`
        : `Google Monthly Service - ${inst.month_label}`;

      const invoice = await InvoiceService.createInvoice({
        client_id: matched.id,
        issue_date: new Date().toISOString().split("T")[0],
        due_date: inst.due_date,
        currency: contract.currency || "EUR",
        payment_terms: "Net 3",
        notes: `Monthly package: ${inst.month_label}`,
        internal_notes: "",
        line_items: [{
          item_description: description,
          quantity: 1,
          unit: "pcs",
          unit_price: netPrice,
          vat_rate: vatRate,
          discount_rate: 0,
        }],
      });

      // Persist the invoice_id link to the installment row
      await supabase
        .from('monthly_installments')
        .update({ invoice_id: invoice.id })
        .eq('id', inst.id);

      setCreatedInvoices(prev => ({ ...prev, [inst.id]: invoice }));
      setMatchedClients(prev => ({ ...prev, [inst.id]: matched }));
      setInvoiceIdMap(prev => ({ ...prev, [inst.id]: invoice.id }));

      toast({
        title: "Invoice created",
        description: `Invoice ${invoice.invoice_number} created for ${contract.client_name} — ${inst.month_label}`,
      });
    } catch (err: any) {
      console.error("Invoice creation failed:", err);
      toast({ title: "Error", description: err.message || "Failed to create invoice", variant: "destructive" });
    } finally {
      setCreatingInvoiceIds(prev => { const n = new Set(prev); n.delete(inst.id); return n; });
    }
  };

  const handleOpenSendDialog = async (contract: MonthlyContract, inst: MonthlyInstallment) => {
    const language = detectLanguageFromAddress(contract.company_address);
    let invoice = createdInvoices[inst.id] || null;
    let client = matchedClients[inst.id] || null;

    if (!client) {
      try {
        const clients = await InvoiceService.getClients();
        client = clients.find(c => 
          c.email.toLowerCase() === contract.client_email.toLowerCase() &&
          c.name.toLowerCase() === contract.client_name.toLowerCase()
        ) || null;
        if (!client) {
          client = clients.find(c => c.email.toLowerCase() === contract.client_email.toLowerCase()) || null;
        }
        if (!client) {
          client = await InvoiceService.createClient({
            name: contract.client_name,
            email: contract.client_email,
            contact_person: contract.client_name,
            address: (contract as any).company_address || "",
            phone: (contract as any).contact_phone || "",
          });
          toast({ title: "Client auto-created", description: `Client "${contract.client_name}" was added to the invoice system.` });
        }
      } catch {}
    }

    setSendDialogData({ contract, installment: inst, invoice, client, language });
    setSendDialogOpen(true);
  };

  const toggleExpand = (contractId: string) => {
    setExpandedContracts((prev) => {
      const next = new Set(prev);
      if (next.has(contractId)) next.delete(contractId);
      else next.add(contractId);
      return next;
    });
  };

  const sendToggleNotification = (installment: MonthlyInstallment, toggleType: "paid" | "invoice_sent", newValue: boolean) => {
    const contract = contracts.find(c => c.id === installment.contract_id);
    if (!contract) return;
    enqueueNotification('send-monthly-toggle-notification', {
      clientName: contract.client_name,
      clientEmail: contract.client_email,
      monthLabel: installment.month_label,
      amount: installment.amount,
      currency: installment.currency || contract.currency || "EUR",
      toggleType,
      newValue,
      changedBy: currentUserName || "Unknown",
    });
  };

  const handleToggleStatus = async (installment: MonthlyInstallment) => {
    const newStatus = installment.payment_status === "paid" ? "unpaid" : "paid";
    setTogglingIds((prev) => new Set(prev).add(installment.id));
    try {
      await monthlyContractService.togglePaymentStatus(installment.id, newStatus);

      // Sync linked invoice status
      const linkedInvoiceId = invoiceIdMap[installment.id] || installment.invoice_id;
      if (linkedInvoiceId) {
        if (newStatus === "paid") {
          await supabase.from('invoices').update({ status: 'paid', next_reminder_at: null }).eq('id', linkedInvoiceId);
        } else {
          await supabase.from('invoices').update({ status: 'sent', next_reminder_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() }).eq('id', linkedInvoiceId);
        }
      }

      toast({ title: newStatus === "paid" ? "Marked as paid" : "Marked as unpaid" });
      sendToggleNotification(installment, "paid", newStatus === "paid");
      onRefresh();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setTogglingIds((prev) => { const next = new Set(prev); next.delete(installment.id); return next; });
    }
  };

  const handleToggleEmailSent = async (installment: MonthlyInstallment) => {
    const newStatus = !installment.email_sent;
    setTogglingEmailIds((prev) => new Set(prev).add(installment.id));
    try {
      await monthlyContractService.toggleEmailSent(installment.id, newStatus);

      // Sync linked invoice status
      const linkedInvoiceId = invoiceIdMap[installment.id] || installment.invoice_id;
      if (linkedInvoiceId) {
        if (newStatus) {
          await supabase.from('invoices').update({ status: 'sent', next_reminder_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() }).eq('id', linkedInvoiceId);
        } else {
          await supabase.from('invoices').update({ status: 'draft', next_reminder_at: null }).eq('id', linkedInvoiceId);
        }
      }

      toast({ title: newStatus ? "Marked as sent" : "Marked as not sent" });
      sendToggleNotification(installment, "invoice_sent", newStatus);
      onRefresh();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setTogglingEmailIds((prev) => { const next = new Set(prev); next.delete(installment.id); return next; });
    }
  };

  const handleDeleteContract = async (contractId: string) => {
    try {
      await monthlyContractService.deleteContract(contractId);
      toast({ title: "Contract deleted" });
      onRefresh();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const formatPrice = (amount: number, currency: string) =>
    new Intl.NumberFormat("de-DE", { style: "currency", currency: currency || "EUR" }).format(amount);

  const getContractInstallments = (contractId: string) =>
    installments.filter((i) => i.contract_id === contractId);

  const getPaidCount = (contractId: string) =>
    getContractInstallments(contractId).filter((i) => i.payment_status === "paid").length;

  if (contracts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No monthly contracts yet. Create a new contract to get started.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {contracts.map((contract) => {
        const contractInstallments = getContractInstallments(contract.id);
        const paidCount = getPaidCount(contract.id);
        const totalInstallments = Math.floor(contract.duration_months / (contract.billing_frequency || 1));
        const progressPercent = totalInstallments > 0 ? (paidCount / totalInstallments) * 100 : 0;
        const isExpanded = expandedContracts.has(contract.id);
        const hasPortal = portalStatuses[contract.id] ?? false;

        return (
          <div key={contract.id} className="border rounded-lg overflow-hidden bg-card">
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => toggleExpand(contract.id)}
            >
              <div className="flex items-center gap-3">
                {isExpanded ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                <div>
                  <div className="font-semibold text-foreground flex items-center gap-2">
                    {contract.client_name}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            {hasPortal ? (
                              <UserCheck className="w-4 h-4 text-green-500" />
                            ) : (
                              <UserX className="w-4 h-4 text-muted-foreground/50" />
                            )}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {hasPortal ? "Client portal active" : "No client portal"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {contract.client_email}
                    {(contract as any).contact_phone && ` · ${(contract as any).contact_phone}`}
                    {contract.website && (
                      <>
                        {" · "}
                        <a href={contract.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {contract.website} <ExternalLink className="w-3 h-3" />
                        </a>
                      </>
                    )}
                  </div>
                  {(contract as any).company_address && (
                    <div className="text-xs text-muted-foreground">{(contract as any).company_address}</div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-sm font-medium">{formatPrice(contract.monthly_amount, contract.currency)} / {getFrequencyLabel(contract.billing_frequency || 1)}</div>
                  <div className="text-xs text-muted-foreground">Total: {formatPrice(contract.total_value, contract.currency)}</div>
                </div>
                <div className="w-40">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{paidCount} / {totalInstallments} paid</span>
                    <span className="font-medium">{Math.round(progressPercent)}%</span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                </div>
                <Badge variant={contract.status === "active" ? "default" : contract.status === "completed" ? "secondary" : "destructive"}>
                  {contract.status === "active" ? "Active" : contract.status === "completed" ? "Completed" : "Cancelled"}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-8 px-2 ${hasPortal ? "border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPortalModalContract(contract);
                  }}
                >
                  <KeyRound className="w-4 h-4 mr-1" />
                  Portal
                </Button>
                {isAdmin && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={(e) => e.stopPropagation()}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete contract?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete the contract and all associated installments.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteContract(contract.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>

            {isExpanded && (
              <div className="border-t">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Invoice Sent</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contractInstallments.map((inst) => {
                      const isPaid = inst.payment_status === "paid";
                      const isCreating = creatingInvoiceIds.has(inst.id);
                      const hasInvoice = !!createdInvoices[inst.id] || !!invoiceIdMap[inst.id] || !!inst.invoice_id;
                      return (
                        <TableRow key={inst.id} className={cn(isPaid ? "bg-green-500/5 hover:bg-green-500/10" : "bg-red-500/5 hover:bg-red-500/10")}>
                          <TableCell className="font-medium">{inst.month_label}</TableCell>
                          <TableCell>{new Date(inst.due_date).toLocaleDateString("en-US")}</TableCell>
                          <TableCell className="font-semibold">{formatPrice(inst.amount, inst.currency)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch checked={inst.email_sent} disabled={togglingEmailIds.has(inst.id)} onCheckedChange={() => handleToggleEmailSent(inst)} />
                              <span className="text-xs text-muted-foreground">{inst.email_sent ? "Sent" : "Pending"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={isPaid ? "default" : "destructive"}>{isPaid ? "Paid" : "Unpaid"}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      disabled={isCreating}
                                      onClick={() => handleCreateInvoice(contract, inst)}
                                    >
                                      {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>{hasInvoice ? `Invoice linked` : `Create Invoice for ${inst.month_label}`}</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => handleOpenSendDialog(contract, inst)}
                                    >
                                      <Mail className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Send Invoice for {inst.month_label}</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Switch checked={isPaid} disabled={togglingIds.has(inst.id)} onCheckedChange={() => handleToggleStatus(inst)} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        );
      })}

      {sendDialogData && (
        <SendMonthlyInvoiceDialog
          open={sendDialogOpen}
          onOpenChange={setSendDialogOpen}
          contract={sendDialogData.contract}
          installment={sendDialogData.installment}
          detectedLanguage={sendDialogData.language}
          invoice={sendDialogData.invoice}
          client={sendDialogData.client}
          onRefresh={onRefresh}
        />
      )}

      {portalModalContract && (
        <CreateClientPortalModal
          open={!!portalModalContract}
          onOpenChange={(open) => { if (!open) setPortalModalContract(null); }}
          entity={{
            id: portalModalContract.id,
            name: portalModalContract.client_name,
            contactName: portalModalContract.client_name,
            contactEmail: portalModalContract.client_email,
            entityType: "contract",
          }}
          onSuccess={() => {
            onRefresh();
            // Re-check portal statuses
            setPortalStatuses(prev => ({ ...prev, [portalModalContract.id]: true }));
            setPortalModalContract(null);
          }}
        />
      )}
    </div>
  );
};

export default MonthlyInstallmentsTable;
