import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Sidebar from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Check, Minus, RefreshCw, PlayCircle, Receipt, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

type Row = {
  contractId: string;
  clientName: string;
  clientEmail: string;
  amount: number | null;
  currency: string;
  invoiceId: string | null;
  invoiceNumber: string | null;
  emailSent: boolean;
  emailSentAt: string | null;
  monthLabel: string | null;
  hasInstallment: boolean;
};

const MONTHS_DE = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];

function currentMonthLabel(): string {
  const d = new Date();
  return `${MONTHS_DE[d.getMonth()]} ${d.getFullYear()}`;
}

function firstOfMonthISO(monthLabel: string): string {
  const [m, y] = monthLabel.split(" ");
  const monthIdx = MONTHS_DE.indexOf(m);
  if (monthIdx < 0) return new Date().toISOString().slice(0, 10);
  return `${y}-${String(monthIdx + 1).padStart(2, "0")}-01`;
}

function formatPrice(amount: number | null, currency: string): string {
  if (amount == null) return "—";
  try {
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: currency || "EUR" }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function formatSarajevo(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Sarajevo",
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

const MonthlyInvoiceStatus: React.FC = () => {
  const { user } = useAuth();
  const isAdminOrAgent = user?.role === "admin" || user?.role === "agent";

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthLabel());
  const [availableMonths, setAvailableMonths] = useState<string[]>([currentMonthLabel()]);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [runningCatchup, setRunningCatchup] = useState(false);

  const loadMonths = useCallback(async () => {
    const { data } = await supabase
      .from("monthly_installments")
      .select("month_label")
      .order("created_at", { ascending: false })
      .limit(1000);
    const unique = Array.from(new Set((data || []).map((r: any) => r.month_label).filter(Boolean)));
    const merged = Array.from(new Set([currentMonthLabel(), ...unique]));
    setAvailableMonths(merged);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const firstISO = firstOfMonthISO(selectedMonth);
      const { data: contracts, error: cErr } = await supabase
        .from("monthly_contracts")
        .select("id, client_name, client_email, currency, monthly_amount, start_date, status")
        .eq("status", "active")
        .lte("start_date", firstISO);
      if (cErr) throw cErr;

      const contractIds = (contracts || []).map((c: any) => c.id);
      const { data: installments } = contractIds.length
        ? await supabase
            .from("monthly_installments")
            .select("contract_id, invoice_id, email_sent, email_sent_at, amount, currency, month_label")
            .in("contract_id", contractIds)
            .eq("month_label", selectedMonth)
        : { data: [] as any[] };

      const invoiceIds = (installments || []).filter((i: any) => i.invoice_id).map((i: any) => i.invoice_id);
      const { data: invoices } = invoiceIds.length
        ? await supabase.from("invoices").select("id, invoice_number").in("id", invoiceIds)
        : { data: [] as any[] };

      const invoiceMap = new Map<string, string>();
      for (const inv of invoices || []) invoiceMap.set(inv.id, inv.invoice_number);

      const installMap = new Map<string, any>();
      for (const i of installments || []) installMap.set(i.contract_id, i);

      const merged: Row[] = (contracts || []).map((c: any) => {
        const inst = installMap.get(c.id);
        return {
          contractId: c.id,
          clientName: c.client_name,
          clientEmail: c.client_email,
          amount: inst ? Number(inst.amount) : Number(c.monthly_amount),
          currency: (inst?.currency || c.currency || "EUR") as string,
          invoiceId: inst?.invoice_id || null,
          invoiceNumber: inst?.invoice_id ? invoiceMap.get(inst.invoice_id) || null : null,
          emailSent: !!inst?.email_sent,
          emailSentAt: inst?.email_sent_at || null,
          monthLabel: inst?.month_label || null,
          hasInstallment: !!inst,
        };
      });

      // Sort: missing invoice first, then missing email, then alphabetical
      merged.sort((a, b) => {
        const aMissingInv = !a.invoiceId ? 0 : 1;
        const bMissingInv = !b.invoiceId ? 0 : 1;
        if (aMissingInv !== bMissingInv) return aMissingInv - bMissingInv;
        const aMissingEmail = !a.emailSent ? 0 : 1;
        const bMissingEmail = !b.emailSent ? 0 : 1;
        if (aMissingEmail !== bMissingEmail) return aMissingEmail - bMissingEmail;
        return a.clientName.localeCompare(b.clientName);
      });

      setRows(merged);
    } catch (err: any) {
      toast({ title: "Error loading invoice status", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => { loadMonths(); }, [loadMonths]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const stats = useMemo(() => ({
    total: rows.length,
    withInvoice: rows.filter(r => r.invoiceId).length,
    emailSent: rows.filter(r => r.emailSent).length,
    missing: rows.filter(r => !r.invoiceId || !r.emailSent).length,
  }), [rows]);

  const retryOne = async (contractId: string) => {
    setRetryingId(contractId);
    try {
      const { error } = await supabase.functions.invoke("generate-monthly-installments", {
        body: { contract_id: contractId, trigger: "manual" },
      });
      if (error) throw error;
      toast({ title: "Retry triggered", description: "Re-generation started. Refresh in a few seconds." });
      // Optimistic delay then refetch
      setTimeout(() => fetchData(), 8000);
    } catch (err: any) {
      toast({ title: "Retry failed", description: err.message, variant: "destructive" });
    } finally {
      setRetryingId(null);
    }
  };

  const runCatchup = async () => {
    setRunningCatchup(true);
    try {
      const { data, error } = await supabase.functions.invoke("monthly-billing-catchup");
      if (error) throw error;
      const count = (data as any)?.retriggered ?? 0;
      toast({ title: "Catch-up started", description: `Re-triggered ${count} contracts. Refreshing in 10s.` });
      setTimeout(() => fetchData(), 10000);
    } catch (err: any) {
      toast({ title: "Catch-up failed", description: err.message, variant: "destructive" });
    } finally {
      setRunningCatchup(false);
    }
  };

  if (!isAdminOrAgent) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex min-w-0">
          <Layout>
            <div className="p-6 text-muted-foreground">You don't have access to this page.</div>
          </Layout>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex min-w-0">
        <Layout>
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Receipt className="w-8 h-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold">Monthly Invoice Status</h1>
                  <p className="text-sm text-muted-foreground">
                    Per-contract view of invoice creation and email delivery for the selected month.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMonths.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={fetchData} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button onClick={runCatchup} disabled={runningCatchup}>
                  <PlayCircle className={`w-4 h-4 mr-2 ${runningCatchup ? "animate-spin" : ""}`} />
                  Run catchup now
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Total contracts</div>
                <div className="text-2xl font-bold">{stats.total}</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Invoice created</div>
                <div className="text-2xl font-bold text-emerald-600">{stats.withInvoice}</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Email sent</div>
                <div className="text-2xl font-bold text-emerald-600">{stats.emailSent}</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Missing</div>
                <div className={`text-2xl font-bold ${stats.missing > 0 ? "text-destructive" : "text-emerald-600"}`}>
                  {stats.missing}
                </div>
              </Card>
            </div>

            {!loading && stats.missing === 0 && stats.total > 0 && (
              <Card className="p-4 bg-emerald-50 border-emerald-200 text-emerald-900 flex items-center gap-2">
                <Check className="w-5 h-5" />
                All contracts billed and emails delivered for {selectedMonth}.
              </Card>
            )}

            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead className="text-center">Invoice created</TableHead>
                    <TableHead className="text-center">Email sent</TableHead>
                    <TableHead>Last send attempt</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
                  )}
                  {!loading && rows.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No active contracts for this month.</TableCell></TableRow>
                  )}
                  {!loading && rows.map((r) => {
                    const tint = !r.invoiceId
                      ? "bg-red-50 hover:bg-red-100"
                      : !r.emailSent
                        ? "bg-amber-50 hover:bg-amber-100"
                        : "";
                    return (
                      <TableRow key={r.contractId} className={tint}>
                        <TableCell className="font-medium">{r.clientName}</TableCell>
                        <TableCell className="text-sm">{r.clientEmail}</TableCell>
                        <TableCell className="text-right">{formatPrice(r.amount, r.currency)}</TableCell>
                        <TableCell>
                          {r.invoiceId && r.invoiceNumber ? (
                            <Link to={`/invoices/${r.invoiceId}`} className="text-primary hover:underline">
                              {r.invoiceNumber}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {r.invoiceId ? (
                            <Check className="w-4 h-4 text-emerald-600 inline" />
                          ) : (
                            <Minus className="w-4 h-4 text-destructive inline" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {r.emailSent ? (
                            <Check className="w-4 h-4 text-emerald-600 inline" />
                          ) : (
                            <Minus className="w-4 h-4 text-destructive inline" />
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{formatSarajevo(r.emailSentAt)}</TableCell>
                        <TableCell className="text-right">
                          {(!r.invoiceId || !r.emailSent) ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => retryOne(r.contractId)}
                              disabled={retryingId === r.contractId}
                            >
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              {retryingId === r.contractId ? "Retrying…" : "Retry now"}
                            </Button>
                          ) : (
                            <Badge variant="secondary">OK</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </div>
        </Layout>
      </div>
    </div>
  );
};

export default MonthlyInvoiceStatus;
