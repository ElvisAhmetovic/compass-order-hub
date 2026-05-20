import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, RefreshCw, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CronRun {
  id: string;
  started_at: string;
  finished_at: string | null;
  trigger: string;
  contracts_total: number;
  processed: number;
  invoices_created: number;
  client_emails_sent: number;
  team_emails_sent: number;
  errors_count: number;
  status: string;
  notes: string | null;
}

interface ContractResult {
  id: string;
  contract_id: string | null;
  client_name: string | null;
  month_label: string | null;
  status: string;
  reason: string | null;
  error_detail: string | null;
}

interface Props {
  isAdmin: boolean;
  onRefresh: () => void;
}

const CronRunStatusPanel: React.FC<Props> = ({ isAdmin, onRefresh }) => {
  const [lastRun, setLastRun] = useState<CronRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [results, setResults] = useState<ContractResult[]>([]);
  const [retrying, setRetrying] = useState<string | null>(null);

  const fetchLastRun = useCallback(async () => {
    const { data } = await supabase
      .from("monthly_cron_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setLastRun(data as any);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLastRun(); }, [fetchLastRun]);

  const loadResults = async () => {
    if (!lastRun) return;
    const { data } = await supabase
      .from("monthly_cron_contract_results")
      .select("*")
      .eq("run_id", lastRun.id)
      .order("created_at", { ascending: true });
    setResults((data as any) || []);
    setShowDetails(true);
  };

  const runNow = async () => {
    setRunning(true);
    try {
      const { error } = await supabase.functions.invoke("generate-monthly-installments", {
        body: { trigger: "manual" },
      });
      if (error) throw error;
      toast({ title: "Monthly run started", description: "Refreshing in a few seconds..." });
      setTimeout(() => { fetchLastRun(); onRefresh(); }, 4000);
    } catch (e: any) {
      toast({ title: "Run failed", description: e.message, variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  const retryContract = async (contractId: string) => {
    setRetrying(contractId);
    try {
      const url = `https://fjybmlugiqmiggsdrkiq.supabase.co/functions/v1/generate-monthly-installments?contract_id=${contractId}&trigger=manual`;
      const res = await fetch(url, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "Retry triggered" });
      setTimeout(() => { fetchLastRun(); loadResults(); onRefresh(); }, 3000);
    } catch (e: any) {
      toast({ title: "Retry failed", description: e.message, variant: "destructive" });
    } finally {
      setRetrying(null);
    }
  };

  if (loading) return null;

  const formatDate = (s: string) => new Date(s).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });
  const statusColor = lastRun?.status === "completed" ? "text-green-600" :
                      lastRun?.status === "failed" ? "text-red-600" :
                      lastRun?.status === "completed_with_errors" ? "text-amber-600" : "text-muted-foreground";

  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-[260px]">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold">Automated Monthly Billing</h3>
          </div>
          {lastRun ? (
            <div className="text-sm text-muted-foreground space-y-1">
              <div>
                Last run: <span className="font-medium text-foreground">{formatDate(lastRun.started_at)}</span>
                {" "}<Badge variant="outline" className={statusColor}>{lastRun.status}</Badge>
                {" "}<span className="text-xs">({lastRun.trigger})</span>
              </div>
              <div>
                {lastRun.client_emails_sent}/{lastRun.contracts_total} client emails sent
                {lastRun.errors_count > 0 && (
                  <span className="text-red-600 ml-2">• {lastRun.errors_count} errors</span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No runs recorded yet.</p>
          )}
        </div>
        <div className="flex gap-2">
          {lastRun && (
            <Button variant="outline" size="sm" onClick={loadResults}>
              <AlertCircle className="w-4 h-4 mr-1" /> Details
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={fetchLastRun}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          {isAdmin && (
            <Button size="sm" onClick={runNow} disabled={running}>
              {running ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Play className="w-4 h-4 mr-1" />}
              Run now
            </Button>
          )}
        </div>
      </div>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Run details — {lastRun && formatDate(lastRun.started_at)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {results.length === 0 ? (
              <p className="text-sm text-muted-foreground">No per-contract results.</p>
            ) : results.map(r => (
              <div key={r.id} className="flex items-center justify-between gap-2 border-b pb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {r.status === "sent" && <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />}
                    {r.status === "failed" && <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
                    {r.status === "skipped" && <Clock className="w-4 h-4 text-muted-foreground shrink-0" />}
                    {r.status === "already_sent" && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                    <span className="font-medium truncate">{r.client_name}</span>
                    <Badge variant="outline" className="text-xs">{r.status}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground ml-6 break-words">
                    {r.month_label} {r.reason && `— ${r.reason}`}
                    {r.error_detail && <span className="text-red-600"> ({r.error_detail})</span>}
                  </div>

                </div>
                {r.status === "failed" && r.contract_id && isAdmin && (
                  <Button size="sm" variant="outline"
                    disabled={retrying === r.contract_id}
                    onClick={() => retryContract(r.contract_id!)}>
                    {retrying === r.contract_id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Retry"}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CronRunStatusPanel;
