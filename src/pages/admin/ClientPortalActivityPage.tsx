import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, RefreshCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { activitySummary, describeActivity, EVENT_LABELS, type ActivityRow } from "@/services/portalActivityView";

const DAY = 86_400_000;
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

const ClientPortalActivityPage = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState("");
  const [event, setEvent] = useState("all");
  const [from, setFrom] = useState(isoDay(new Date(Date.now() - 30 * DAY)));
  const [to, setTo] = useState(isoDay(new Date()));

  const load = useCallback(async () => {
    setLoading(true); setFailed(false);
    let q = supabase.from("client_portal_activity").select("id, user_id, user_email, event, details, created_at")
      .gte("created_at", `${from}T00:00:00`).lte("created_at", `${to}T23:59:59`)
      .order("created_at", { ascending: false }).limit(2000);
    if (event !== "all") q = q.eq("event", event);
    const { data, error } = await q;
    if (error) { setFailed(true); setRows([]); } else setRows((data ?? []) as ActivityRow[]);
    setLoading(false);
  }, [from, to, event]);
  useEffect(() => { load(); }, [load]);

  const shown = useMemo(() => {
    const s = search.trim().toLowerCase();
    return s ? rows.filter((r) => (r.user_email ?? "").toLowerCase().includes(s)) : rows;
  }, [rows, search]);
  const sum = useMemo(() => activitySummary(shown), [shown]);

  const exportCsv = () => {
    const lines = [["Date", "Time", "Client", "Action", "Details"], ...shown.map((r) => {
      const d = new Date(r.created_at);
      return [d.toLocaleDateString("de-DE"), d.toLocaleTimeString("de-DE"), r.user_email ?? "", EVENT_LABELS[r.event] ?? r.event, describeActivity(r)];
    })].map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","));
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = `client-portal-activity-${from}-${to}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 flex flex-col p-4 md:p-6 gap-4 min-w-0">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}><ArrowLeft className="h-4 w-4 mr-1" />Dashboard</Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Client Portal Activity</h1>
              <p className="text-sm text-muted-foreground">Every login and action clients take in the portal, with date and time.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load}><RefreshCcw className="h-4 w-4 mr-1" />Refresh</Button>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={!shown.length}><Download className="h-4 w-4 mr-1" />Export CSV</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="activity-summary">
          {[["Logins", sum.logins], ["Active clients", sum.activeClients], ["Pay clicks", sum.payClicks], ["Load errors", sum.loadErrors]].map(([k, v]) => (
            <Card key={k} className="p-4"><p className="text-sm text-muted-foreground">{k}</p><p className="text-2xl font-bold text-foreground">{v}</p></Card>
          ))}
        </div>

        <Card className="p-4 flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search client email…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={event} onValueChange={setEvent}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              {Object.entries(EVENT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" className="w-[160px]" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From" />
          <Input type="date" className="w-[160px]" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To" />
        </Card>

        <Card className="overflow-x-auto">
          {failed ? (
            <div className="p-8 text-center space-y-3" role="alert">
              <p className="font-medium text-foreground">The activity log couldn't be loaded.</p>
              <Button size="sm" onClick={load}>Try again</Button>
            </div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Date & time</TableHead><TableHead>Client</TableHead><TableHead>Action</TableHead><TableHead>Details</TableHead></TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>
                  : !shown.length ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No client activity in this period.</TableCell></TableRow>
                  : shown.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap">{new Date(r.created_at).toLocaleString("de-DE")}</TableCell>
                      <TableCell className="break-all">{r.user_email ?? "—"}</TableCell>
                      <TableCell><Badge variant={r.event === "load_failed" ? "destructive" : r.event === "login" ? "default" : "secondary"}>{EVENT_LABELS[r.event] ?? r.event}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{describeActivity(r)}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </Card>
        {rows.length >= 2000 && <p className="text-xs text-muted-foreground">Showing the latest 2000 entries — narrow the dates to see older ones.</p>}
      </div>
    </div>
  );
};

export default ClientPortalActivityPage;
