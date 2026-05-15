import { useEffect, useMemo, useState } from 'react';
import Layout from '@/components/layout/Layout';
import Sidebar from '@/components/dashboard/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Shield, Lock, Unlock, Pencil, Download, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  WorkHourV2, WhAuditRow, WhStatus, isSuperAdminEmail,
  fetchAllEntries, fetchWorkers, fetchAudit, adminUpsert, adminUnlock, companyTodayISO, triggerAutoLock,
} from '@/services/workHoursV2Service';

const WorkHoursAdmin = () => {
  const { user } = useAuth();
  const isSuper = isSuperAdminEmail((user as any)?.email);

  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 14);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(companyTodayISO());
  const [workerFilter, setWorkerFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [rows, setRows] = useState<WorkHourV2[]>([]);
  const [workers, setWorkers] = useState<Array<{ id: string; first_name: string | null; last_name: string | null }>>([]);
  const [loading, setLoading] = useState(false);

  const [editing, setEditing] = useState<{ row?: WorkHourV2; user_id: string; work_date: string } | null>(null);
  const [editForm, setEditForm] = useState({
    total_hours: '', start_time: '', end_time: '', break_minutes: '',
    status: 'admin_override' as WhStatus, locked: false, admin_note: '', reason: '',
  });

  const [auditFor, setAuditFor] = useState<string | null>(null);
  const [audit, setAudit] = useState<WhAuditRow[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      triggerAutoLock().catch(() => {});
      const [r, w] = await Promise.all([fetchAllEntries(from, to), fetchWorkers()]);
      setRows(r); setWorkers(w);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (isSuper) load(); /* eslint-disable-next-line */ }, [from, to, isSuper]);

  useEffect(() => {
    if (!auditFor) { setAudit([]); return; }
    fetchAudit(auditFor).then(setAudit).catch(e => toast.error(e.message));
  }, [auditFor]);

  const filtered = useMemo(() => rows.filter(r => {
    if (workerFilter !== 'all' && r.user_id !== workerFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    return true;
  }), [rows, workerFilter, statusFilter]);

  const workerName = (id: string) => {
    const w = workers.find(x => x.id === id);
    return w ? `${w.first_name || ''} ${w.last_name || ''}`.trim() || id : id;
  };

  const openEdit = (row?: WorkHourV2, user_id?: string, work_date?: string) => {
    const u = user_id || row?.user_id || '';
    const d = work_date || row?.work_date || companyTodayISO();
    setEditing({ row, user_id: u, work_date: d });
    setEditForm({
      total_hours: row ? String(row.total_hours) : '0',
      start_time: row?.start_time || '',
      end_time: row?.end_time || '',
      break_minutes: row?.break_minutes != null ? String(row.break_minutes) : '0',
      status: row?.status || 'admin_override',
      locked: row?.locked || false,
      admin_note: row?.admin_note || '',
      reason: '',
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (!editForm.reason.trim()) { toast.error('Reason is required'); return; }
    try {
      await adminUpsert({
        user_id: editing.user_id,
        work_date: editing.work_date,
        total_hours: parseFloat(editForm.total_hours) || 0,
        start_time: editForm.start_time || null,
        end_time: editForm.end_time || null,
        break_minutes: parseInt(editForm.break_minutes) || 0,
        status: editForm.status,
        locked: editForm.locked,
        admin_note: editForm.admin_note || null,
        reason: editForm.reason,
      });
      toast.success('Saved');
      setEditing(null);
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const onUnlock = async (id: string) => {
    const reason = prompt('Reason for unlock?');
    if (!reason) return;
    try { await adminUnlock(id, reason); toast.success('Unlocked'); load(); }
    catch (e: any) { toast.error(e.message); }
  };

  const STATUS_LABEL: Record<string, string> = {
    submitted: 'Submitted',
    not_submitted: 'Not submitted',
    not_worked: 'Not worked',
    admin_override: 'Admin override',
  };

  const fmtDate = (iso?: string | null) => {
    if (!iso) return '';
    const [y, m, d] = iso.slice(0, 10).split('-');
    return `${d}.${m}.${y}`;
  };
  const fmtTime = (t?: string | null) => (t ? t.slice(0, 5) : '');
  const fmtTs = (iso?: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const exportRows = () =>
    filtered.map(r => ({
      Date: fmtDate(r.work_date),
      Worker: workerName(r.user_id),
      Email: r.worker_email || '',
      Status: STATUS_LABEL[r.status] || r.status,
      Locked: r.locked ? 'Yes' : 'No',
      Hours: Number(r.total_hours) || 0,
      Start: fmtTime(r.start_time),
      End: fmtTime(r.end_time),
      'Break (min)': r.break_minutes ?? 0,
      'Worker Note': (r.worker_note || '').replace(/[\r\n]+/g, ' '),
      'Admin Note': (r.admin_note || '').replace(/[\r\n]+/g, ' '),
      Submitted: fmtTs(r.submitted_at as any),
      'Last Updated': fmtTs(r.updated_at),
    }));

  const totalHours = () => filtered.reduce((s, r) => s + (Number(r.total_hours) || 0), 0);

  const exportCSV = () => {
    const rowsOut = exportRows();
    const headers = Object.keys(rowsOut[0] || {
      Date: '', Worker: '', Email: '', Status: '', Locked: '', Hours: '',
      Start: '', End: '', 'Break (min)': '', 'Worker Note': '', 'Admin Note': '',
      Submitted: '', 'Last Updated': '',
    });
    const esc = (v: any) => {
      const s = v == null ? '' : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    };
    const lines = [headers.map(esc).join(';')];
    rowsOut.forEach(r => lines.push(headers.map(h => esc((r as any)[h])).join(';')));
    // totals row
    const totals: Record<string, any> = {};
    headers.forEach(h => (totals[h] = ''));
    totals['Email'] = 'TOTAL';
    totals['Hours'] = totalHours().toFixed(2).replace('.', ',');
    lines.push(headers.map(h => esc(totals[h])).join(';'));

    const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `work_hours_${from}_${to}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportXLSX = () => {
    const rowsOut = exportRows();
    const headers = ['Date', 'Worker', 'Email', 'Status', 'Locked', 'Hours', 'Start', 'End', 'Break (min)', 'Worker Note', 'Admin Note', 'Submitted', 'Last Updated'];
    const aoa: any[][] = [headers];
    rowsOut.forEach(r => aoa.push(headers.map(h => (r as any)[h])));
    // totals row
    const totalsRow: any[] = headers.map(() => '');
    totalsRow[2] = 'TOTAL';
    totalsRow[5] = totalHours();
    aoa.push(totalsRow);

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [
      { wch: 12 }, { wch: 22 }, { wch: 28 }, { wch: 16 }, { wch: 8 },
      { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 11 }, { wch: 32 }, { wch: 32 },
      { wch: 18 }, { wch: 18 },
    ];
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };
    (ws as any)['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: headers.length - 1, r: aoa.length - 1 } }) };

    // Bold header row + bold totals row + number format on Hours column
    const range = XLSX.utils.decode_range(ws['!ref']!);
    for (let c = range.s.c; c <= range.e.c; c++) {
      const head = ws[XLSX.utils.encode_cell({ r: 0, c })];
      if (head) head.s = { font: { bold: true }, alignment: { horizontal: 'left' } };
      const totCell = ws[XLSX.utils.encode_cell({ r: aoa.length - 1, c })];
      if (totCell) totCell.s = { font: { bold: true } };
    }
    // Hours column number format
    for (let r = 1; r < aoa.length; r++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c: 5 })];
      if (cell && typeof cell.v === 'number') { cell.t = 'n'; cell.z = '0.00'; }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Work Hours');
    XLSX.writeFile(wb, `work_hours_${from}_${to}.xlsx`);
  };


  if (!isSuper) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <Layout userRole={user?.role as any}>
          <div className="max-w-2xl mx-auto py-12 text-center">
            <Shield className="h-12 w-12 mx-auto text-destructive" />
            <h1 className="text-2xl font-bold mt-4">Access denied</h1>
            <p className="text-muted-foreground mt-2">Only the super admin can access this page.</p>
          </div>
        </Layout>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <Layout userRole={user?.role as any}>
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Work Hours — Admin</h1>
          </div>

          <Card>
            <CardContent className="pt-6 flex flex-wrap gap-3 items-end">
              <div><Label>From</Label><Input type="date" value={from} onChange={e => setFrom(e.target.value)} /></div>
              <div><Label>To</Label><Input type="date" value={to} onChange={e => setTo(e.target.value)} /></div>
              <div className="min-w-[200px]">
                <Label>Worker</Label>
                <Select value={workerFilter} onValueChange={setWorkerFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All workers</SelectItem>
                    {workers.map(w => <SelectItem key={w.id} value={w.id}>{w.first_name} {w.last_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-[180px]">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="not_submitted">Not submitted</SelectItem>
                    <SelectItem value="not_worked">Not worked</SelectItem>
                    <SelectItem value="admin_override">Admin override</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-1" />CSV</Button>
              <Button onClick={() => openEdit(undefined, workers[0]?.id, companyTodayISO())}>+ Create entry</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Entries ({filtered.length})</CardTitle></CardHeader>
            <CardContent className="overflow-auto">
              {loading && <div className="text-sm">Loading…</div>}
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground border-b">
                  <tr>
                    <th className="py-2">Date</th><th>Worker</th><th>Status</th><th>Hours</th>
                    <th>Range</th><th>Locked</th><th>Updated</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id} className="border-b hover:bg-muted/30">
                      <td className="py-1 font-mono">{r.work_date}</td>
                      <td>{workerName(r.user_id)}</td>
                      <td>
                        {r.status === 'admin_override' && <Badge className="bg-purple-600">Override</Badge>}
                        {r.status === 'submitted' && <Badge className="bg-green-600">Submitted</Badge>}
                        {r.status === 'not_submitted' && <Badge variant="destructive">Missed</Badge>}
                        {r.status === 'not_worked' && <Badge variant="secondary">Not worked</Badge>}
                      </td>
                      <td>{r.total_hours}h</td>
                      <td>{r.start_time ? `${r.start_time}–${r.end_time}` : '—'}</td>
                      <td>{r.locked ? <Lock className="h-4 w-4" /> : '—'}</td>
                      <td className="text-xs text-muted-foreground">{new Date(r.updated_at).toLocaleString()}</td>
                      <td className="flex gap-1 py-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-3 w-3" /></Button>
                        {r.locked && <Button size="sm" variant="ghost" onClick={() => onUnlock(r.id)}><Unlock className="h-3 w-3" /></Button>}
                        <Button size="sm" variant="ghost" onClick={() => setAuditFor(auditFor === r.id ? null : r.id)}>Audit</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {auditFor && (
                <div className="mt-4 border rounded p-3 bg-muted/30">
                  <div className="font-semibold mb-2 text-sm">Audit log</div>
                  {audit.length === 0 && <div className="text-xs text-muted-foreground">No entries.</div>}
                  <div className="space-y-2">
                    {audit.map(a => (
                      <details key={a.id} className="border rounded p-2 bg-background">
                        <summary className="cursor-pointer text-xs flex gap-2">
                          <Badge variant="outline">{a.action}</Badge>
                          <span>{new Date(a.created_at).toLocaleString()}</span>
                          <span className="text-muted-foreground">by {a.changed_by_email || 'system'} ({a.changed_by_role})</span>
                          {a.reason && <span className="italic">— {a.reason}</span>}
                        </summary>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                          <div><div className="font-semibold">Old</div><pre className="bg-muted p-2 rounded overflow-auto max-h-48">{JSON.stringify(a.old_values, null, 2)}</pre></div>
                          <div><div className="font-semibold">New</div><pre className="bg-muted p-2 rounded overflow-auto max-h-48">{JSON.stringify(a.new_values, null, 2)}</pre></div>
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Admin entry edit</DialogTitle></DialogHeader>
            {editing && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Worker</Label>
                  <Select value={editing.user_id} onValueChange={v => setEditing({ ...editing, user_id: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {workers.map(w => <SelectItem key={w.id} value={w.id}>{w.first_name} {w.last_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Date</Label><Input type="date" value={editing.work_date} onChange={e => setEditing({ ...editing, work_date: e.target.value })} /></div>
                <div><Label>Total hours</Label><Input type="number" step="0.25" min={0} max={24} value={editForm.total_hours} onChange={e => setEditForm({ ...editForm, total_hours: e.target.value })} /></div>
                <div><Label>Status</Label>
                  <Select value={editForm.status} onValueChange={(v: any) => setEditForm({ ...editForm, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="not_submitted">Not submitted</SelectItem>
                      <SelectItem value="not_worked">Not worked</SelectItem>
                      <SelectItem value="admin_override">Admin override</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Start</Label><Input type="time" value={editForm.start_time} onChange={e => setEditForm({ ...editForm, start_time: e.target.value })} /></div>
                <div><Label>End</Label><Input type="time" value={editForm.end_time} onChange={e => setEditForm({ ...editForm, end_time: e.target.value })} /></div>
                <div><Label>Break (min)</Label><Input type="number" min={0} value={editForm.break_minutes} onChange={e => setEditForm({ ...editForm, break_minutes: e.target.value })} /></div>
                <div className="flex items-end gap-2"><Label>Locked</Label><input type="checkbox" checked={editForm.locked} onChange={e => setEditForm({ ...editForm, locked: e.target.checked })} /></div>
                <div className="col-span-2"><Label>Admin note</Label><Textarea value={editForm.admin_note} onChange={e => setEditForm({ ...editForm, admin_note: e.target.value })} /></div>
                <div className="col-span-2"><Label>Reason for change *</Label><Textarea value={editForm.reason} onChange={e => setEditForm({ ...editForm, reason: e.target.value })} placeholder="Required" /></div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={saveEdit}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Layout>
    </div>
  );
};

export default WorkHoursAdmin;
