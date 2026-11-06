import { useCallback, useEffect, useMemo, useState } from "react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import Layout from "@/components/layout/Layout";
import Sidebar from "@/components/dashboard/Sidebar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Send, X, Search, Loader2, RefreshCw, FlaskConical, Trophy } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Draft = {
  id: string; email: string; company_name: string | null; language: string; reason: string | null;
  subject: string; body: string; status: string; last_order_at: string | null; past_services: string | null;
  approved_by_name: string | null; sent_at: string | null; error: string | null; created_at: string;
  won_back_order_id: string | null; won_back_at: string | null;
};

const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" }) : "–");
const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline", sent: "default", rejected: "secondary", failed: "destructive", sending: "outline",
};

async function errText(error: unknown) {
  if (error instanceof FunctionsHttpError) {
    try { const j = await error.context.json(); return j.error || JSON.stringify(j); } catch { /* fallthrough */ }
  }
  return error instanceof Error ? error.message : String(error);
}

export default function AiOutreach() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [tab, setTab] = useState("pending");
  const [q, setQ] = useState("");
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [hints, setHints] = useState<Record<string, string>>({});
  const [myEmail, setMyEmail] = useState<string>("");
  const [skips, setSkips] = useState<{ email: string; company_name: string | null; reason: string; details: string | null; scanned_at: string }[]>([]);
  const [edits, setEdits] = useState<Record<string, { subject: string; body: string }>>({});

  const load = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).from("outreach_drafts").select("*").order("created_at", { ascending: false }).limit(500);
    if (error) toast({ title: "Could not load drafts", description: error.message, variant: "destructive" });
    else setDrafts(data as Draft[]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sk } = await (supabase as any).from("outreach_skips").select("*").order("scanned_at", { ascending: false }).limit(500);
    setSkips(sk ?? []);
  }, []);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setMyEmail(data.user?.email ?? "")); }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => drafts.filter((d) =>
    (tab === "all" || (tab === "won" ? !!d.won_back_order_id : d.status === tab)) &&
    (!q || `${d.email} ${d.company_name ?? ""}`.toLowerCase().includes(q.toLowerCase()))), [drafts, tab, q]);
  const sentTotal = drafts.filter((d) => d.status === "sent").length;
  const wonBack = drafts.filter((d) => d.won_back_order_id).length;
  const sentToday = drafts.filter((d) => d.status === "sent" && d.sent_at && new Date(d.sent_at).toDateString() === new Date().toDateString()).length;

  const scan = async () => {
    setScanning(true);
    const { data, error } = await supabase.functions.invoke("outreach-scan", { body: {} });
    setScanning(false);
    if (error) return toast({ title: "Scan failed", description: await errText(error), variant: "destructive" });
    if (data?.skipped) toast({ title: "Scan is already running", description: "Try again in a few minutes." });
    else if (data?.error) toast({ title: "AI paused", description: data.error, variant: "destructive" });
    else toast({ title: `${data?.created ?? 0} new drafts`, description: `${data?.candidates ?? 0} eligible clients · ${data?.skipped_unpaid ?? 0} skipped for unpaid invoices.` });
    load();
  };

  const send = async (d: Draft) => {
    setBusy(d.id);
    const e = edits[d.id];
    const { error } = await supabase.functions.invoke("outreach-send", { body: { id: d.id, subject: e?.subject, body: e?.body } });
    setBusy(null);
    if (error) toast({ title: "Not sent", description: await errText(error), variant: "destructive" });
    else toast({ title: "Offer sent", description: d.email });
    load();
  };

  const regenerate = async (d: Draft) => {
    setBusy(d.id);
    const { error } = await supabase.functions.invoke("outreach-regenerate", { body: { id: d.id, instruction: hints[d.id] } });
    setBusy(null);
    if (error) return toast({ title: "Could not rewrite", description: await errText(error), variant: "destructive" });
    setEdits((x) => { const n = { ...x }; delete n[d.id]; return n; });
    toast({ title: "Draft rewritten" });
    load();
  };

  const sendTest = async (d: Draft) => {
    if (!myEmail) return toast({ title: "Your account has no email address", variant: "destructive" });
    if (!confirm(`Send a test of this draft to ${myEmail}? The client will not receive it.`)) return;
    setBusy(d.id);
    const e = edits[d.id];
    const { data, error } = await supabase.functions.invoke("outreach-send", { body: { id: d.id, subject: e?.subject, body: e?.body, test: true } });
    setBusy(null);
    if (error) toast({ title: "Test not sent", description: await errText(error), variant: "destructive" });
    else toast({ title: "Test sent to you", description: data?.to });
  };

  const reject = async (d: Draft) => {
    setBusy(d.id);
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id ?? null;
    let name: string | null = auth.user?.email ?? null;
    if (uid) {
      const { data: p } = await supabase.from("profiles").select("first_name, last_name").eq("id", uid).maybeSingle();
      const full = [p?.first_name, p?.last_name].filter(Boolean).join(" ");
      if (full) name = full;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).from("outreach_drafts")
      .update({ status: "rejected", approved_by: uid, approved_by_name: name })
      .eq("id", d.id).eq("status", "pending").select("id");
    setBusy(null);
    if (error) toast({ title: "Could not reject", description: error.message, variant: "destructive" });
    else if (!data?.length) toast({ title: "Could not reject", description: "This draft is no longer pending.", variant: "destructive" });
    else toast({ title: "Draft rejected", description: d.email });
    load();
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex min-w-0">
        <Layout>
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold">AI Outreach</h1>
                  <p className="text-sm text-muted-foreground">
                    Offers for clients with no order or package in 3+ months. Runs automatically in the first week of each month. Nothing is sent without approval. Sent today: {sentToday}/50
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Won back: {wonBack} of {sentTotal} sent ({sentTotal ? Math.round((wonBack / sentTotal) * 100) : 0}%) · new order within 60 days
                  </p>
                </div>
              </div>
              <Button onClick={scan} disabled={scanning}>
                {scanning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Find clients now
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList>
                  {["pending", "sent", "won", "rejected", "failed", "skipped", "all"].map((t) => (
                    <TabsTrigger key={t} value={t} className="capitalize">
                      {t === "won" ? "won back" : t === "skipped" ? "skipped – unpaid" : t} ({t === "all" ? drafts.length : t === "won" ? wonBack : t === "skipped" ? skips.length : drafts.filter((d) => d.status === t).length})
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
                <Input className="pl-8 w-64" placeholder="Search client or email" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
            </div>

            {tab === "skipped" && (
              <Card><CardContent className="pt-6 space-y-2">
                <p className="text-sm text-muted-foreground">These inactive clients got no offer because they have an unpaid invoice. Updated with every scan.</p>
                {skips.filter((s) => !q || `${s.email} ${s.company_name ?? ""}`.toLowerCase().includes(q.toLowerCase())).map((s) => (
                  <div key={s.email} className="flex flex-wrap justify-between gap-2 border-t pt-2 text-sm">
                    <span><span className="font-medium">{s.company_name || s.email}</span> · {s.email}</span>
                    <span className="text-muted-foreground">Unpaid: {s.details} · checked {fmt(s.scanned_at)}</span>
                  </div>
                ))}
                {skips.length === 0 && <p className="text-sm">Nobody skipped.</p>}
              </CardContent></Card>
            )}
            {tab !== "skipped" && filtered.length === 0 && <p className="text-muted-foreground">No drafts here.</p>}
            <div className="grid gap-4">
              {filtered.map((d) => {
                const editable = d.status === "pending";
                const e = edits[d.id] ?? { subject: d.subject, body: d.body };
                return (
                  <Card key={d.id}>
                    <CardHeader className="pb-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base">{d.company_name || d.email}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {d.email} · {d.language.toUpperCase()} · last order {d.last_order_at ? new Date(d.last_order_at).toLocaleDateString("de-DE") : "–"}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {d.won_back_order_id && <Badge><Trophy className="h-3 w-3 mr-1" />Won back</Badge>}
                          <Badge variant={statusVariant[d.status] ?? "outline"} className="capitalize">{d.status}</Badge>
                        </div>
                      </div>
                      {d.reason && <p className="text-sm"><span className="font-medium">Why:</span> {d.reason}</p>}
                      {d.past_services && <p className="text-xs text-muted-foreground">Past services: {d.past_services}</p>}
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {editable ? (
                        <>
                          <Input value={e.subject} onChange={(ev) => setEdits({ ...edits, [d.id]: { ...e, subject: ev.target.value } })} />
                          <Textarea rows={8} value={e.body} onChange={(ev) => setEdits({ ...edits, [d.id]: { ...e, body: ev.target.value } })} />
                          <div className="flex flex-wrap gap-2">
                            <Input className="h-9 w-64" placeholder="Rewrite hint, e.g. shorter, more formal" value={hints[d.id] ?? ""}
                              onChange={(ev) => setHints({ ...hints, [d.id]: ev.target.value })} />
                            <Button size="sm" variant="outline" onClick={() => regenerate(d)} disabled={busy === d.id}><RefreshCw className="h-4 w-4 mr-1" />Rewrite with AI</Button>
                            <Button size="sm" variant="outline" onClick={() => sendTest(d)} disabled={busy === d.id}><FlaskConical className="h-4 w-4 mr-1" />Send test to me{myEmail ? ` (${myEmail})` : ""}</Button>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => send(d)} disabled={busy === d.id}><Send className="h-4 w-4 mr-1" />Send</Button>
                            <Button size="sm" variant="outline" onClick={() => reject(d)} disabled={busy === d.id}><X className="h-4 w-4 mr-1" />Reject</Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="font-medium text-sm">{d.subject}</p>
                          <p className="text-sm whitespace-pre-wrap text-muted-foreground">{d.body}</p>
                        </>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Created {fmt(d.created_at)}
                        {d.sent_at && ` · Sent ${fmt(d.sent_at)}`}
                        {d.approved_by_name && ` · ${d.status === "rejected" ? "rejected" : "by"} ${d.approved_by_name}`}
                        {d.won_back_at && ` · New order ${fmt(d.won_back_at)}`}
                        {d.error && ` · ${d.error}`}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </Layout>
      </div>
    </div>
  );
}
