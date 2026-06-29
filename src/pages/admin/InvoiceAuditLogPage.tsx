import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, RefreshCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { isSuperAdminEmail } from "@/services/workHoursV2Service";
import {
  InvoiceAuditService,
  type InvoiceAuditLog,
  type InvoiceAuditOutcome,
} from "@/services/invoiceAuditService";

const OUTCOME_OPTIONS: { value: InvoiceAuditOutcome | "all"; label: string }[] = [
  { value: "all", label: "All outcomes" },
  { value: "success", label: "Success" },
  { value: "conflict_409", label: "409 Conflict" },
  { value: "validation_error", label: "Validation error" },
  { value: "permission_denied", label: "Permission denied" },
  { value: "unknown_error", label: "Unknown error" },
];

function outcomeBadge(outcome: string) {
  const map: Record<string, string> = {
    success: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30",
    conflict_409: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
    validation_error: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30",
    permission_denied: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30",
    unknown_error: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30",
  };
  return (
    <Badge variant="outline" className={map[outcome] || ""}>
      {outcome.replace(/_/g, " ")}
    </Badge>
  );
}

function formatDateTime(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

const PAGE_SIZE = 100;

export default function InvoiceAuditLogPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isSuper = isSuperAdminEmail((user as any)?.email);

  const [rows, setRows] = useState<InvoiceAuditLog[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [outcome, setOutcome] = useState<InvoiceAuditOutcome | "all">("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<InvoiceAuditLog | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = async () => {
    if (!isSuper) return;
    setLoading(true);
    try {
      const { rows, count } = await InvoiceAuditService.list({
        outcome,
        search: debouncedSearch,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      });
      setRows(rows);
      setCount(count);
    } catch (err: any) {
      toast({
        title: "Failed to load audit log",
        description: err?.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outcome, debouncedSearch, page, isSuper]);

  const exportCsv = () => {
    const header = [
      "created_at", "outcome", "source", "actor_email", "actor_name",
      "order_id", "order_company_name", "client_name",
      "invoice_number", "invoice_id", "attempt_number",
      "error_code", "error_message",
    ];
    const escape = (v: any) => {
      const s = v == null ? "" : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    };
    const csv = [
      header.join(","),
      ...rows.map(r => header.map(h => escape((r as any)[h])).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  if (!isSuper) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="max-w-md p-8 text-center">
          <h2 className="text-lg font-semibold mb-2">Restricted</h2>
          <p className="text-sm text-muted-foreground mb-4">
            The invoice audit log is only visible to super admins.
          </p>
          <Button onClick={() => navigate("/dashboard")}>Back to dashboard</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 flex flex-col p-6 gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/invoices")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">Invoice Audit Log</h1>
              <p className="text-sm text-muted-foreground">
                Every invoice creation attempt — successes, 409 conflicts, and errors.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={rows.length === 0}>
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
          </div>
        </div>

        <Card className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoice #, company, email, error..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="pl-8"
              />
            </div>
            <Select value={outcome} onValueChange={(v) => { setOutcome(v as any); setPage(0); }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OUTCOME_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground ml-auto">
              {count} {count === 1 ? "entry" : "entries"}
            </div>
          </div>
        </Card>

        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Invoice #</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && rows.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No audit entries match the filter.</TableCell></TableRow>
              ) : rows.map(r => (
                <TableRow key={r.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setSelected(r)}>
                  <TableCell className="whitespace-nowrap text-xs">{formatDateTime(r.created_at)}</TableCell>
                  <TableCell className="text-xs">
                    <div className="font-medium">{r.actor_name || "—"}</div>
                    <div className="text-muted-foreground">{r.actor_email || "—"}</div>
                  </TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">
                    {r.order_company_name || "—"}
                  </TableCell>
                  <TableCell className="text-xs max-w-[160px] truncate">{r.client_name || "—"}</TableCell>
                  <TableCell className="text-xs font-mono">{r.invoice_number || "—"}</TableCell>
                  <TableCell>{outcomeBadge(r.outcome)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.source}</TableCell>
                  <TableCell className="text-xs max-w-[220px] truncate text-red-600 dark:text-red-400">
                    {r.error_message || ""}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={page === 0 || loading} onClick={() => setPage(p => Math.max(0, p - 1))}>
            Previous
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </div>
          <Button variant="outline" size="sm" disabled={page + 1 >= totalPages || loading} onClick={() => setPage(p => p + 1)}>
            Next
          </Button>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit entry</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Time" value={formatDateTime(selected.created_at)} />
                <Field label="Outcome" value={selected.outcome} />
                <Field label="Source" value={selected.source} />
                <Field label="Attempt" value={String(selected.attempt_number)} />
                <Field label="Actor" value={`${selected.actor_name || ""} <${selected.actor_email || ""}>`} />
                <Field label="Actor role" value={selected.actor_role || "—"} />
                <Field label="Order ID" value={selected.order_id || "—"} />
                <Field label="Order company" value={selected.order_company_name || "—"} />
                <Field label="Order email" value={selected.order_contact_email || "—"} />
                <Field label="Order price" value={selected.order_price != null ? `${selected.order_price} ${selected.order_currency || ""}` : "—"} />
                <Field label="Client" value={`${selected.client_name || "—"} (${selected.client_id || "—"})`} />
                <Field label="Invoice #" value={selected.invoice_number || "—"} />
                <Field label="Invoice ID" value={selected.invoice_id || "—"} />
                <Field label="Error code" value={selected.error_code || "—"} />
              </div>
              {selected.error_message && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Error message</div>
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto whitespace-pre-wrap">{selected.error_message}</pre>
                </div>
              )}
              {selected.metadata && Object.keys(selected.metadata).length > 0 && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Metadata</div>
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">{JSON.stringify(selected.metadata, null, 2)}</pre>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                {selected.invoice_id && (
                  <Button size="sm" onClick={() => navigate(`/invoices/${selected.invoice_id}`)}>
                    View invoice
                  </Button>
                )}
                {selected.order_id && (
                  <Button size="sm" variant="outline" onClick={() => navigate(`/dashboard?orderId=${selected.order_id}`)}>
                    View order
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="text-sm break-all">{value}</div>
    </div>
  );
}
