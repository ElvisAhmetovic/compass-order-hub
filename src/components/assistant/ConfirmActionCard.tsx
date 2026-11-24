import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { InvoiceResultActions } from "./InvoiceResultActions";
import { batchTargets, batchResults } from "./batchActionView";

type Action = { id: string; tool: string; summary: string; status: string; result: unknown; args: unknown };

export function ConfirmActionCard({ actionId }: { actionId: string }) {
  const [action, setAction] = useState<Action | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("assistant_actions").select("id,tool,summary,status,result,args").eq("id", actionId).maybeSingle()
      .then(({ data, error }) => { if (error) toast({ title: "Could not load action", description: error.message, variant: "destructive" }); setAction(data as Action | null); });
  }, [actionId]);

  useEffect(() => {
    if (action?.status !== "processing") return;
    const timer = window.setInterval(() => {
      supabase.from("assistant_actions").select("id,tool,summary,status,result,args").eq("id", actionId).maybeSingle()
        .then(({ data }) => { if (data) setAction(data as Action); });
    }, 2000);
    return () => window.clearInterval(timer);
  }, [actionId, action?.status]);

  const decide = async (decision: "confirm" | "cancel") => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("admin-assistant-confirm", { body: { actionId, decision } });
    setBusy(false);
    let status = (data as { status?: string } | null)?.status;
    let result: unknown = (data as { result?: unknown } | null)?.result;
    if (error) {
      const body = await (error as { context?: Response }).context?.json?.().catch(() => null);
      status = body?.status ?? "failed";
      result = body?.result ?? result;
      toast({ title: "Action failed", description: JSON.stringify(body?.result?.error ?? body?.error ?? error.message), variant: "destructive" });
    } else if (status === "confirmed") toast({ title: "Done", description: action?.summary });
    setAction((a) => (a ? { ...a, status: status ?? a.status, result: result ?? a.result } : a));
  };

  if (!action) return null;
  const tone = action.status === "confirmed" ? "default" : action.status === "failed" ? "destructive" : "secondary";
  const targets = batchTargets(action.args);
  const results = batchResults(action.result);
  return (
    <div className="mt-2 rounded-lg border border-border bg-card p-3 text-sm">
      <div className="flex items-center gap-2 font-medium"><ShieldCheck className="h-4 w-4 text-primary" />Proposed change<Badge variant={tone} className="ml-auto capitalize">{action.status}</Badge></div>
      <p className="mt-1 text-foreground">{action.summary}</p>
      {!!targets.length && <ul className="mt-2 max-h-60 overflow-y-auto divide-y divide-border">
        {targets.map(target => {
          const result = results.find(row => row.id === target.id);
          return <li key={target.id} className="py-2 break-words"><p className="font-medium">{target.label}</p><p className="text-xs text-muted-foreground">{target.detail}</p>
            {result && <p className={result.status === "done" ? "text-xs text-foreground" : "text-xs text-destructive"}>{result.status === "done" ? "Done" : "Not completed"}{result.message ? ` — ${result.message}` : ""}</p>}
          </li>;
        })}
      </ul>}
      {action.status === "processing" && <p className="mt-2 flex items-center gap-2 text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />Processing — do not repeat this action.</p>}
      {action.status === "pending" && (
        <div className="mt-3 flex gap-2">
          <Button size="sm" disabled={busy} onClick={() => decide("confirm")}>{busy && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}Confirm</Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => decide("cancel")}>Cancel</Button>
        </div>
      )}
      {action.status === "confirmed" && action.tool === "create_invoice" && (action.result as { invoice_id?: string } | null)?.invoice_id && (
        <InvoiceResultActions invoiceId={(action.result as { invoice_id: string }).invoice_id} />
      )}
      {action.status === "failed" && <p className="mt-1 text-destructive">{JSON.stringify((action.result as { error?: unknown } | null)?.error ?? action.result)}</p>}
    </div>
  );
}
