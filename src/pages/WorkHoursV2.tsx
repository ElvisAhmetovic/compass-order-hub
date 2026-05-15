import { useEffect, useState, useMemo } from 'react';
import Layout from '@/components/layout/Layout';
import Sidebar from '@/components/dashboard/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Clock, Lock, ShieldAlert, ShieldCheck } from 'lucide-react';
import {
  WorkHourV2, companyTodayISO, companyNowParts, isBeforeDeadline,
  fetchMyEntries, submitMyHours, triggerAutoLock, fetchAudit, WhAuditRow,
} from '@/services/workHoursV2Service';

const StatusBadge = ({ row }: { row: WorkHourV2 }) => {
  if (row.status === 'admin_override') return <Badge className="bg-purple-600">Admin Override</Badge>;
  if (row.locked && row.status === 'not_submitted') return <Badge variant="destructive">Missed</Badge>;
  if (row.locked) return <Badge variant="secondary"><Lock className="h-3 w-3 mr-1" />Locked</Badge>;
  if (row.status === 'submitted') return <Badge className="bg-green-600">Submitted</Badge>;
  return <Badge variant="outline">{row.status}</Badge>;
};

const Countdown = () => {
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force(x => x + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const { h, m, s } = companyNowParts();
  const remaining = (12 * 3600) - (h * 3600 + m * 60 + s);
  if (remaining <= 0) return <span className="text-destructive font-semibold">Deadline passed</span>;
  const hh = Math.floor(remaining / 3600);
  const mm = Math.floor((remaining % 3600) / 60);
  const ss = remaining % 60;
  return <span className="font-mono">{hh}h {mm}m {ss}s</span>;
};

const HistoryDrawer = ({ entryId, onClose }: { entryId: string | null; onClose: () => void }) => {
  const [rows, setRows] = useState<WhAuditRow[]>([]);
  useEffect(() => {
    if (!entryId) return;
    fetchAudit(entryId).then(setRows).catch(e => toast.error(e.message));
  }, [entryId]);
  if (!entryId) return null;
  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle className="text-base">Change history</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
      </CardHeader>
      <CardContent>
        {rows.length === 0 && <p className="text-sm text-muted-foreground">No changes yet.</p>}
        <div className="space-y-3">
          {rows.map(r => (
            <div key={r.id} className="border-l-2 pl-3 text-sm">
              <div className="flex gap-2 items-center">
                <Badge variant="outline">{r.action}</Badge>
                <span className="text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                By {r.changed_by_email || 'system'} · {r.changed_by_role || '-'} · source: {r.source}
              </div>
              {r.reason && <div className="text-xs mt-1">Reason: {r.reason}</div>}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const WorkHoursV2 = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<WorkHourV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const today = companyTodayISO();

  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [breakMin, setBreakMin] = useState('');
  const [hours, setHours] = useState('');
  const [note, setNote] = useState('');

  const todayRow = useMemo(() => entries.find(e => e.work_date === today) || null, [entries, today]);
  const beforeDeadline = isBeforeDeadline();
  const canEdit = beforeDeadline && !(todayRow?.locked);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // fire-and-forget auto-lock check (server will gate on time)
      triggerAutoLock().catch(() => {});
      const list = await fetchMyEntries(user.id, today);
      setEntries(list);
      const t = list.find(e => e.work_date === today);
      if (t) {
        setStart(t.start_time || '');
        setEnd(t.end_time || '');
        setBreakMin(String(t.break_minutes ?? ''));
        setHours(String(t.total_hours ?? ''));
        setNote(t.worker_note || '');
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id]);

  const onSubmit = async () => {
    const total = parseFloat(hours);
    if (isNaN(total) || total < 0 || total > 24) { toast.error('Enter valid hours (0–24)'); return; }
    setSaving(true);
    try {
      await submitMyHours({
        total_hours: total,
        start_time: start || null,
        end_time: end || null,
        break_minutes: breakMin ? parseInt(breakMin) : 0,
        worker_note: note || null,
      });
      toast.success('Saved');
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally { setSaving(false); }
  };

  const monthSummary = useMemo(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const inMonth = entries.filter(e => e.work_date.startsWith(ym));
    return {
      total: inMonth.reduce((s, e) => s + Number(e.total_hours || 0), 0),
      missed: inMonth.filter(e => e.status === 'not_submitted' && e.locked).length,
      locked: inMonth.filter(e => e.locked).length,
    };
  }, [entries]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <Layout userRole={user?.role as any}>
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">My Work Hours</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Today — {today}</span>
                {todayRow ? <StatusBadge row={todayRow} /> : (beforeDeadline ? <Badge>Open</Badge> : <Badge variant="destructive">Deadline passed</Badge>)}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Submission deadline: 12:00 (Europe/Sarajevo). Time left: <Countdown />
              </p>
            </CardHeader>
            <CardContent>
              {!canEdit && !todayRow && (
                <div className="rounded-md bg-destructive/10 border border-destructive/40 p-3 text-sm text-destructive flex gap-2 items-start">
                  <ShieldAlert className="h-4 w-4 mt-0.5" />
                  Deadline passed. Your work hours for today are locked. Contact admin if this is incorrect.
                </div>
              )}
              {!canEdit && todayRow?.locked && (
                <div className="rounded-md bg-muted p-3 text-sm flex gap-2 items-start">
                  <Lock className="h-4 w-4 mt-0.5" />
                  This day is locked{todayRow.locked_reason ? `: ${todayRow.locked_reason}` : '.'} Contact admin if this is incorrect.
                </div>
              )}
              {canEdit && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <div><Label>Start</Label><Input type="time" value={start} onChange={e => setStart(e.target.value)} /></div>
                  <div><Label>End</Label><Input type="time" value={end} onChange={e => setEnd(e.target.value)} /></div>
                  <div><Label>Break (min)</Label><Input type="number" min={0} value={breakMin} onChange={e => setBreakMin(e.target.value)} /></div>
                  <div><Label>Total hours *</Label><Input type="number" step="0.25" min={0} max={24} value={hours} onChange={e => setHours(e.target.value)} /></div>
                  <div className="md:col-span-5"><Label>Note</Label><Textarea value={note} onChange={e => setNote(e.target.value)} /></div>
                  <div className="md:col-span-5">
                    <Button onClick={onSubmit} disabled={saving}>
                      {saving ? 'Saving…' : (todayRow ? 'Update' : 'Submit')}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-3">
            <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Month total hours</div><div className="text-2xl font-bold">{monthSummary.total}</div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Missed days</div><div className="text-2xl font-bold">{monthSummary.missed}</div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Locked days</div><div className="text-2xl font-bold">{monthSummary.locked}</div></CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">My entries (today onward)</CardTitle></CardHeader>
            <CardContent>
              {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
              {!loading && entries.length === 0 && <div className="text-sm text-muted-foreground">No entries yet.</div>}
              <div className="divide-y">
                {entries.map(e => (
                  <div key={e.id} className="py-2 flex flex-wrap items-center gap-3 text-sm">
                    <div className="font-mono w-28">{e.work_date}</div>
                    <StatusBadge row={e} />
                    <div>{e.total_hours}h</div>
                    {e.start_time && <div className="text-muted-foreground">{e.start_time}–{e.end_time}</div>}
                    {e.admin_note && <div className="text-xs text-purple-700"><ShieldCheck className="h-3 w-3 inline mr-1" />{e.admin_note}</div>}
                    <div className="ml-auto">
                      <Button variant="ghost" size="sm" onClick={() => setHistoryId(e.id === historyId ? null : e.id)}>
                        {historyId === e.id ? 'Hide' : 'History'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <HistoryDrawer entryId={historyId} onClose={() => setHistoryId(null)} />
            </CardContent>
          </Card>
        </div>
      </Layout>
    </div>
  );
};

export default WorkHoursV2;
