import { useEffect, useMemo, useRef, useState } from 'react';
import Layout from '@/components/layout/Layout';
import Sidebar from '@/components/dashboard/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Shield, Lock, Unlock, Pencil, Download, FileSpreadsheet, Plus } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  WorkHourV2, WhAuditRow, WhStatus, isSuperAdminEmail,
  fetchAllEntries, fetchWorkers, fetchAudit, adminUpsert, adminUnlock,
  companyTodayISO, triggerAutoLock, adminBulkSetLock, fetchAuditCounts, subscribeAllEntries,
} from '@/services/workHoursV2Service';

type ViewMode = 'list' | 'monthly';

// ----- Date helpers -----
const isoFromDate = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const addDays = (iso: string, days: number) => {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return isoFromDate(d);
};
const startOfWeekISO = (iso: string) => {
  const d = new Date(iso + 'T00:00:00');
  const day = d.getDay(); // Sun=0
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  return isoFromDate(d);
};
const startOfMonthISO = (iso: string) => `${iso.slice(0, 7)}-01`;
const endOfMonthISO = (iso: string) => {
  const [y, m] = iso.split('-').map(Number);
  return isoFromDate(new Date(y, m, 0));
};
const monthLabel = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};
const isWeekday = (iso: string) => {
  const d = new Date(iso + 'T00:00:00').getDay();
  return d >= 1 && d <= 5;
};
const datesBetween = (from: string, to: string): string[] => {
  const out: string[] = [];
  let cur = from;
  while (cur <= to) { out.push(cur); cur = addDays(cur, 1); }
  return out;
};

const STATUS_LABEL: Record<string, string> = {
  submitted: 'Submitted',
  not_submitted: 'Not submitted',
  not_worked: 'Not worked',
  admin_override: 'Admin override',
};

const StatusChip = ({ status, locked }: { status: string; locked?: boolean }) => {
  const cls =
    status === 'submitted' ? 'bg-emerald-600 text-white hover:bg-emerald-600' :
    status === 'admin_override' ? 'bg-amber-500 text-white hover:bg-amber-500' :
    status === 'not_submitted' ? 'bg-rose-600 text-white hover:bg-rose-600' :
    status === 'not_worked' ? 'bg-slate-500 text-white hover:bg-slate-500' :
    status === 'missing' ? 'bg-zinc-300 text-zinc-800 hover:bg-zinc-300' :
    'bg-muted text-foreground';
  const label =
    status === 'missing' ? 'Missing' :
    status === 'admin_override' ? 'Override' :
    status === 'not_submitted' ? 'Missed' :
    status === 'not_worked' ? 'Not worked' :
    status === 'submitted' ? 'Submitted' : status;
  return (
    <span className="inline-flex items-center gap-1">
      <Badge className={cls}>{label}</Badge>
      {locked && <Lock className="h-3.5 w-3.5 text-rose-600" />}
    </span>
  );
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

const WorkHoursAdmin = () => {
  const { user } = useAuth();
  const isSuper = isSuperAdminEmail((user as any)?.email);

  const today = companyTodayISO();
  const [from, setFrom] = useState(() => addDays(today, -14));
  const [to, setTo] = useState(today);
  const [workerFilter, setWorkerFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [view, setView] = useState<ViewMode>('list');
  const [showMissing, setShowMissing] = useState(false);
  const [includeMissingInExport, setIncludeMissingInExport] = useState(true);
  const [rows, setRows] = useState<WorkHourV2[]>([]);
  const [workers, setWorkers] = useState<Array<{ id: string; first_name: string | null; last_name: string | null }>>([]);
  const [loading, setLoading] = useState(false);
  const [auditCounts, setAuditCounts] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [editing, setEditing] = useState<{ row?: WorkHourV2; user_id: string; work_date: string } | null>(null);
  const [editForm, setEditForm] = useState({
    total_hours: '', start_time: '', end_time: '', break_minutes: '',
    status: 'admin_override' as WhStatus, locked: false, admin_note: '', reason: '',
  });

  const [auditFor, setAuditFor] = useState<string | null>(null);
  const [audit, setAudit] = useState<WhAuditRow[]>([]);

  const subRef = useRef<(() => void) | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      triggerAutoLock().catch(() => {});
      const [r, w] = await Promise.all([fetchAllEntries(from, to), fetchWorkers()]);
      setRows(r); setWorkers(w);
      const counts = await fetchAuditCounts(r.map(x => x.id));
      setAuditCounts(counts);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (isSuper) load(); /* eslint-disable-next-line */ }, [from, to, isSuper]);

  // Realtime subscription
  useEffect(() => {
    if (!isSuper) return;
    if (subRef.current) { subRef.current(); subRef.current = null; }
    subRef.current = subscribeAllEntries(from, to, ({ eventType, new: newRow, old: oldRow }) => {
      setRows(prev => {
        if (eventType === 'DELETE' && oldRow) return prev.filter(r => r.id !== oldRow.id);
        if (!newRow) return prev;
        const idx = prev.findIndex(r => r.id === newRow.id);
        if (idx === -1) return [newRow, ...prev];
        const copy = prev.slice();
        copy[idx] = newRow;
        return copy;
      });
    });
    return () => { if (subRef.current) { subRef.current(); subRef.current = null; } };
  }, [from, to, isSuper]);

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

  // Workers in scope (filtered by workerFilter)
  const workersInScope = useMemo(
    () => workers.filter(w => workerFilter === 'all' || w.id === workerFilter),
    [workers, workerFilter],
  );

  // Missing days computation: weekdays in [from, to] up to today, per worker
  const missingDays = useMemo(() => {
    if (statusFilter !== 'all') return [] as Array<{ user_id: string; work_date: string }>;
    const upperBound = to > today ? today : to;
    if (from > upperBound) return [];
    const allDates = datesBetween(from, upperBound).filter(isWeekday);
    const out: Array<{ user_id: string; work_date: string }> = [];
    workersInScope.forEach(w => {
      const submitted = new Set(rows.filter(r => r.user_id === w.id).map(r => r.work_date));
      allDates.forEach(d => {
        if (!submitted.has(d)) out.push({ user_id: w.id, work_date: d });
      });
    });
    return out;
  }, [rows, workersInScope, from, to, today, statusFilter]);

  // KPI cards
  const kpis = useMemo(() => {
    const totalHours = filtered.reduce((s, r) => s + (Number(r.total_hours) || 0), 0);
    const activeWorkers = new Set(filtered.filter(r => Number(r.total_hours) > 0).map(r => r.user_id)).size;
    const entries = filtered.length;
    const days = new Set(filtered.map(r => `${r.user_id}|${r.work_date}`)).size;
    const avg = days ? totalHours / days : 0;
    return { totalHours, activeWorkers, entries, avg };
  }, [filtered]);

  // ----- Edit / save -----
  const openEdit = (row?: WorkHourV2, user_id?: string, work_date?: string) => {
    const u = user_id || row?.user_id || workers[0]?.id || '';
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

  // ----- Bulk actions -----
  const toggleSelected = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const allVisibleIds = useMemo(() => filtered.map(r => r.id), [filtered]);
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selected.has(id));
  const toggleAllVisible = () => {
    setSelected(prev => {
      if (allSelected) {
        const next = new Set(prev);
        allVisibleIds.forEach(id => next.delete(id));
        return next;
      }
      const next = new Set(prev);
      allVisibleIds.forEach(id => next.add(id));
      return next;
    });
  };

  const bulkSetLock = async (lock: boolean) => {
    if (!selected.size) return;
    const reason = prompt(`Reason to ${lock ? 'lock' : 'unlock'} ${selected.size} selected entr${selected.size === 1 ? 'y' : 'ies'}?`);
    if (!reason) return;
    try {
      const n = await adminBulkSetLock(Array.from(selected), lock, reason);
      toast.success(`${lock ? 'Locked' : 'Unlocked'} ${n} entr${n === 1 ? 'y' : 'ies'}`);
      setSelected(new Set());
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  // ----- Date presets -----
  const presets = [
    { label: 'Today', set: () => { setFrom(today); setTo(today); } },
    { label: 'This week', set: () => { setFrom(startOfWeekISO(today)); setTo(today); } },
    { label: 'This month', set: () => { setFrom(startOfMonthISO(today)); setTo(today); } },
    {
      label: 'Last month', set: () => {
        const start = addDays(startOfMonthISO(today), -1);
        setFrom(startOfMonthISO(start));
        setTo(endOfMonthISO(start));
      },
    },
    { label: 'Last 14 days', set: () => { setFrom(addDays(today, -14)); setTo(today); } },
  ];

  // ----- Exports -----
  const HEADERS = ['Date', 'Worker', 'Email', 'Status', 'Locked', 'Hours', 'Start', 'End', 'Break (min)', 'Worker Note', 'Admin Note', 'Submitted', 'Last Updated'];
  const COL_WIDTHS = [12, 22, 28, 16, 8, 8, 8, 8, 11, 32, 32, 18, 18];

  const rowToArray = (r: WorkHourV2) => [
    fmtDate(r.work_date),
    workerName(r.user_id),
    r.worker_email || '',
    STATUS_LABEL[r.status] || r.status,
    r.locked ? 'Yes' : 'No',
    Number(r.total_hours) || 0,
    fmtTime(r.start_time),
    fmtTime(r.end_time),
    r.break_minutes ?? 0,
    (r.worker_note || '').replace(/[\r\n]+/g, ' '),
    (r.admin_note || '').replace(/[\r\n]+/g, ' '),
    fmtTs(r.submitted_at as any),
    fmtTs(r.updated_at),
  ];

  const emailByUser = useMemo(() => {
    const m: Record<string, string> = {};
    rows.forEach(r => { if (r.worker_email && !m[r.user_id]) m[r.user_id] = r.worker_email; });
    return m;
  }, [rows]);
  const missingRowToArray = (uid: string, date: string) => [
    fmtDate(date),
    workerName(uid),
    emailByUser[uid] || '',
    'Missing',
    'No',
    0,
    '',
    '',
    0,
    '',
    '',
    '',
    '',
  ];

  const blankRow = (): any[] => HEADERS.map(() => '');
  const subtotalRow = (label: string, hours: number, count: number): any[] => {
    const row: any[] = blankRow();
    row[2] = label;
    row[3] = `${count} entr${count === 1 ? 'y' : 'ies'}`;
    row[5] = Number(hours.toFixed(2));
    return row;
  };

  const filterDescription = () => {
    const w = workerFilter === 'all' ? 'All workers' : workerName(workerFilter);
    const s = statusFilter === 'all' ? 'All statuses' : (STATUS_LABEL[statusFilter] || statusFilter);
    return `Worker: ${w} · Status: ${s}`;
  };

  // KPI/summary header block (returned as array-of-arrays, no formatting)
  const kpiBlock = () => {
    const block: any[][] = [
      ['Work Hours Report'],
      [`Range: ${fmtDate(from)} – ${fmtDate(to)}`],
      [`Filters: ${filterDescription()}`],
      [`View: ${view === 'monthly' ? 'Monthly (grouped)' : 'List'}`],
      [],
      ['Total hours', Number(kpis.totalHours.toFixed(2)), 'Workers active', kpis.activeWorkers, 'Entries', kpis.entries, 'Avg hrs/day', Number(kpis.avg.toFixed(2))],
      [],
    ];
    return block;
  };

  type MissingItem = { user_id: string; work_date: string };

  // Builds Worker → Month grouped body rows with subtotals
  const groupedBody = (entries: WorkHourV2[], missing: MissingItem[] = []) => {
    const out: any[][] = [];
    const byWorker = new Map<string, { entries: WorkHourV2[]; missing: MissingItem[] }>();
    const ensure = (k: string) => {
      if (!byWorker.has(k)) byWorker.set(k, { entries: [], missing: [] });
      return byWorker.get(k)!;
    };
    entries.forEach(r => ensure(r.user_id).entries.push(r));
    missing.forEach(m => ensure(m.user_id).missing.push(m));

    const sortedWorkers = Array.from(byWorker.entries())
      .sort((a, b) => workerName(a[0]).localeCompare(workerName(b[0])));

    let grand = 0;
    let grandCount = 0;
    let grandMissing = 0;
    sortedWorkers.forEach(([uid, bucket]) => {
      const byMonth = new Map<string, { entries: WorkHourV2[]; missing: MissingItem[] }>();
      const ensureMonth = (ym: string) => {
        if (!byMonth.has(ym)) byMonth.set(ym, { entries: [], missing: [] });
        return byMonth.get(ym)!;
      };
      bucket.entries.forEach(r => ensureMonth(r.work_date.slice(0, 7)).entries.push(r));
      bucket.missing.forEach(m => ensureMonth(m.work_date.slice(0, 7)).missing.push(m));

      const months = Array.from(byMonth.entries()).sort((a, b) => b[0].localeCompare(a[0]));
      let workerTotal = 0;
      let workerCount = 0;
      let workerMissing = 0;
      months.forEach(([ym, mb]) => {
        type Row = { date: string; arr: any[]; isMissing: boolean };
        const all: Row[] = [
          ...mb.entries.map(r => ({ date: r.work_date, arr: rowToArray(r), isMissing: false })),
          ...mb.missing.map(m => ({ date: m.work_date, arr: missingRowToArray(m.user_id, m.work_date), isMissing: true })),
        ].sort((a, b) => b.date.localeCompare(a.date));
        const monthHours = mb.entries.reduce((s, r) => s + (Number(r.total_hours) || 0), 0);
        out.push([`${workerName(uid)} — ${monthLabel(ym)}`]);
        out.push(HEADERS);
        all.forEach(r => out.push(r.arr));
        const labelExtra = mb.missing.length ? ` · ${mb.missing.length} missing` : '';
        out.push(subtotalRow(`Subtotal · ${monthLabel(ym)}${labelExtra}`, monthHours, mb.entries.length));
        out.push(blankRow());
        workerTotal += monthHours;
        workerCount += mb.entries.length;
        workerMissing += mb.missing.length;
      });
      const wExtra = workerMissing ? ` · ${workerMissing} missing` : '';
      out.push(subtotalRow(`TOTAL · ${workerName(uid)}${wExtra}`, workerTotal, workerCount));
      out.push(blankRow());
      grand += workerTotal;
      grandCount += workerCount;
      grandMissing += workerMissing;
    });
    const gExtra = grandMissing ? ` · ${grandMissing} missing` : '';
    out.push(subtotalRow(`GRAND TOTAL${gExtra}`, grand, grandCount));
    return out;
  };

  const flatBody = (entries: WorkHourV2[], missing: MissingItem[] = []) => {
    const out: any[][] = [HEADERS];
    let total = 0;
    type Row = { date: string; arr: any[] };
    const all: Row[] = [
      ...entries.map(r => { total += Number(r.total_hours) || 0; return { date: r.work_date, arr: rowToArray(r) }; }),
      ...missing.map(m => ({ date: m.work_date, arr: missingRowToArray(m.user_id, m.work_date) })),
    ].sort((a, b) => b.date.localeCompare(a.date));
    all.forEach(r => out.push(r.arr));
    const extra = missing.length ? ` · ${missing.length} missing` : '';
    out.push(subtotalRow(`GRAND TOTAL${extra}`, total, entries.length));
    return out;
  };

  const exportMissing = (): MissingItem[] => {
    if (!showMissing || !includeMissingInExport) return [];
    return missingDays.filter(m => workerFilter === 'all' || m.user_id === workerFilter);
  };

  const exportCSV = () => {
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const fmtCell = (v: any) => typeof v === 'number' ? esc(v.toFixed(2).replace('.', ',')) : esc(v);
    const block: any[][] = [
      ...kpiBlock(),
      ...(view === 'monthly' ? groupedBody(filtered, exportMissing()) : flatBody(filtered, exportMissing())),
    ];
    const lines = block.map(row => row.map(fmtCell).join(';'));
    const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `work_hours_${from}_${to}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const styleSheet = (ws: any, aoa: any[][]) => {
    ws['!cols'] = COL_WIDTHS.map(wch => ({ wch }));
    const lastCol = HEADERS.length - 1;
    for (let r = 0; r < aoa.length; r++) {
      const first = aoa[r][0];
      const isHeaderRow = Array.isArray(aoa[r]) && aoa[r][0] === 'Date' && aoa[r][1] === 'Worker';
      const isGroupHeader = aoa[r].length === 1 && typeof first === 'string' && !!first;
      const isSubtotal = typeof aoa[r][2] === 'string' && (String(aoa[r][2]).startsWith('Subtotal') || String(aoa[r][2]).startsWith('TOTAL') || aoa[r][2] === 'GRAND TOTAL');
      for (let c = 0; c <= lastCol; c++) {
        const cell = ws[XLSX.utils.encode_cell({ r, c })];
        if (!cell) continue;
        if (isHeaderRow) cell.s = { font: { bold: true }, fill: { fgColor: { rgb: 'EFEFEF' } } };
        else if (isGroupHeader) cell.s = { font: { bold: true, color: { rgb: '1F4E79' } } };
        else if (isSubtotal) cell.s = { font: { bold: true }, fill: { fgColor: { rgb: 'F5F5F5' } } };
        if (c === 5 && typeof cell.v === 'number') { cell.t = 'n'; cell.z = '0.00'; }
      }
    }
  };

  const buildSheet = (entries: WorkHourV2[], grouped: boolean, missing: MissingItem[] = []) => {
    const aoa: any[][] = [
      ...kpiBlock(),
      ...(grouped ? groupedBody(entries, missing) : flatBody(entries, missing)),
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    styleSheet(ws, aoa);
    return ws;
  };

  const exportXLSX = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, buildSheet(filtered, view === 'monthly', exportMissing()), 'Work Hours');
    XLSX.writeFile(wb, `work_hours_${from}_${to}.xlsx`);
  };

  const exportXLSXByWorker = () => {
    const wb = XLSX.utils.book_new();
    const missingAll = exportMissing();
    const byWorker = new Map<string, { entries: WorkHourV2[]; missing: MissingItem[] }>();
    const ensure = (k: string) => {
      if (!byWorker.has(k)) byWorker.set(k, { entries: [], missing: [] });
      return byWorker.get(k)!;
    };
    filtered.forEach(r => ensure(r.user_id).entries.push(r));
    missingAll.forEach(m => ensure(m.user_id).missing.push(m));

    if (byWorker.size === 0) {
      XLSX.utils.book_append_sheet(wb, buildSheet([], false), 'Empty');
    } else {
      const summary: any[][] = [
        ...kpiBlock(),
        ['Worker', 'Entries', 'Total hours', 'Missing days'],
        ...Array.from(byWorker.entries())
          .sort((a, b) => workerName(a[0]).localeCompare(workerName(b[0])))
          .map(([uid, b]) => [
            workerName(uid),
            b.entries.length,
            Number(b.entries.reduce((s, r) => s + (Number(r.total_hours) || 0), 0).toFixed(2)),
            b.missing.length,
          ]),
      ];
      const wsSum = XLSX.utils.aoa_to_sheet(summary);
      wsSum['!cols'] = [{ wch: 28 }, { wch: 10 }, { wch: 14 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, wsSum, 'Summary');

      Array.from(byWorker.entries())
        .sort((a, b) => workerName(a[0]).localeCompare(workerName(b[0])))
        .forEach(([uid, b]) => {
          const name = (workerName(uid) || 'Worker').replace(/[\\/?*[\]:]/g, '_').slice(0, 31) || 'Worker';
          XLSX.utils.book_append_sheet(wb, buildSheet(b.entries, true, b.missing), name);
        });
    }
    XLSX.writeFile(wb, `work_hours_by_worker_${from}_${to}.xlsx`);
  };

  // ----- Monthly grouping -----
  const monthlyGroups = useMemo(() => {
    // Map<userId, Map<YYYY-MM, WorkHourV2[]>>
    const out = new Map<string, Map<string, WorkHourV2[]>>();
    filtered.forEach(r => {
      const ym = r.work_date.slice(0, 7);
      if (!out.has(r.user_id)) out.set(r.user_id, new Map());
      const m = out.get(r.user_id)!;
      if (!m.has(ym)) m.set(ym, []);
      m.get(ym)!.push(r);
    });
    return out;
  }, [filtered]);

  const expectedWeekdaysInMonth = (ym: string) => {
    const start = `${ym}-01`;
    const end = endOfMonthISO(start);
    const upper = end > today ? today : end;
    const lower = start < from ? from : start;
    const cap = upper > to ? to : upper;
    if (lower > cap) return 0;
    return datesBetween(lower, cap).filter(isWeekday).length;
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

  // Combined missing rows for list view
  const visibleMissing = showMissing ? missingDays.filter(m =>
    workerFilter === 'all' || m.user_id === workerFilter
  ) : [];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <Layout userRole={user?.role as any}>
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Work Hours — Admin</h1>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card><CardContent className="pt-4">
              <div className="text-xs text-muted-foreground">Total hours</div>
              <div className="text-2xl font-bold">{kpis.totalHours.toFixed(2)}</div>
            </CardContent></Card>
            <Card><CardContent className="pt-4">
              <div className="text-xs text-muted-foreground">Workers active</div>
              <div className="text-2xl font-bold">{kpis.activeWorkers}</div>
            </CardContent></Card>
            <Card><CardContent className="pt-4">
              <div className="text-xs text-muted-foreground">Entries</div>
              <div className="text-2xl font-bold">{kpis.entries}</div>
            </CardContent></Card>
            <Card><CardContent className="pt-4">
              <div className="text-xs text-muted-foreground">Avg hrs / day</div>
              <div className="text-2xl font-bold">{kpis.avg.toFixed(2)}</div>
            </CardContent></Card>
          </div>

          {/* Toolbar */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-muted-foreground mr-1">Quick:</span>
                {presets.map(p => (
                  <Button key={p.label} size="sm" variant="outline" onClick={p.set}>{p.label}</Button>
                ))}
                <span className="ml-auto inline-flex rounded-md border overflow-hidden">
                  <button
                    onClick={() => setView('list')}
                    className={`px-3 py-1.5 text-xs ${view === 'list' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
                  >List</button>
                  <button
                    onClick={() => setView('monthly')}
                    className={`px-3 py-1.5 text-xs ${view === 'monthly' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
                  >Monthly</button>
                </span>
              </div>

              <div className="flex flex-wrap gap-3 items-end">
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
                <label className="flex items-center gap-2 text-sm pb-2">
                  <Checkbox checked={showMissing} onCheckedChange={(v) => setShowMissing(!!v)} />
                  Show missing days
                </label>
                {showMissing && (
                  <label className="flex items-center gap-2 text-sm pb-2">
                    <Checkbox checked={includeMissingInExport} onCheckedChange={(v) => setIncludeMissingInExport(!!v)} />
                    Include in exports
                  </label>
                )}
                <Button onClick={() => openEdit(undefined, workers[0]?.id, today)}>
                  <Plus className="h-4 w-4 mr-1" />Create entry
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 items-center pt-1 border-t">
                <span className="text-xs text-muted-foreground mr-1">
                  {filtered.length} entr{filtered.length === 1 ? 'y' : 'ies'} ·
                  {' '}{kpis.totalHours.toFixed(2)} hours
                  {showMissing ? ` · ${visibleMissing.length} missing days` : ''}
                </span>
                <div className="ml-auto flex gap-2">
                  {selected.size > 0 && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => bulkSetLock(true)}>
                        <Lock className="h-4 w-4 mr-1" />Lock {selected.size}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => bulkSetLock(false)}>
                        <Unlock className="h-4 w-4 mr-1" />Unlock {selected.size}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
                    </>
                  )}
                  <Button size="sm" variant="outline" onClick={exportCSV}>
                    <Download className="h-4 w-4 mr-1" />CSV
                  </Button>
                  <Button size="sm" variant="outline" onClick={exportXLSX}>
                    <FileSpreadsheet className="h-4 w-4 mr-1" />Excel
                  </Button>
                  <Button size="sm" variant="outline" onClick={exportXLSXByWorker}>
                    <FileSpreadsheet className="h-4 w-4 mr-1" />Excel by worker
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        const { data, error } = await supabase.functions.invoke(
                          'send-workhours-daily-reminder',
                          { body: { force: true } },
                        );
                        if (error) throw error;
                        toast({
                          title: 'Reminder sent',
                          description: `Sent: ${data?.sent ?? 0} / ${data?.total ?? 0}`,
                        });
                      } catch (e: any) {
                        toast({ title: 'Failed', description: e.message, variant: 'destructive' });
                      }
                    }}
                  >
                    Send reminder now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          {view === 'list' ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Entries ({filtered.length}{showMissing && visibleMissing.length > 0 ? ` + ${visibleMissing.length} missing` : ''})
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-auto">
                {loading && <div className="text-sm">Loading…</div>}
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground border-b">
                    <tr>
                      <th className="py-2 w-8">
                        <Checkbox checked={allSelected} onCheckedChange={toggleAllVisible} />
                      </th>
                      <th>Date</th><th>Worker</th><th>Status</th><th>Hours</th>
                      <th>Range</th><th>Updated</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => {
                      const aCount = auditCounts[r.id] || 0;
                      return (
                        <tr key={r.id} className="border-b hover:bg-muted/30">
                          <td className="py-1">
                            <Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggleSelected(r.id)} />
                          </td>
                          <td className="py-1 font-mono">{fmtDate(r.work_date)}</td>
                          <td>{workerName(r.user_id)}</td>
                          <td><StatusChip status={r.status} locked={r.locked} /></td>
                          <td>{Number(r.total_hours).toFixed(2)}h</td>
                          <td>{r.start_time ? `${fmtTime(r.start_time)}–${fmtTime(r.end_time)}` : '—'}</td>
                          <td className="text-xs text-muted-foreground">
                            {fmtTs(r.updated_at)}
                            {aCount > 1 && (
                              <button
                                className="ml-2 text-[10px] underline text-primary"
                                onClick={() => setAuditFor(auditFor === r.id ? null : r.id)}
                                title="View audit history"
                              >edited {aCount}x</button>
                            )}
                          </td>
                          <td className="flex gap-1 py-1">
                            <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-3 w-3" /></Button>
                            {r.locked && <Button size="sm" variant="ghost" onClick={() => onUnlock(r.id)}><Unlock className="h-3 w-3" /></Button>}
                            <Button size="sm" variant="ghost" onClick={() => setAuditFor(auditFor === r.id ? null : r.id)}>Audit</Button>
                          </td>
                        </tr>
                      );
                    })}
                    {visibleMissing.map(m => (
                      <tr key={`miss-${m.user_id}-${m.work_date}`} className="border-b bg-muted/20 text-muted-foreground">
                        <td className="py-1"></td>
                        <td className="py-1 font-mono">{fmtDate(m.work_date)}</td>
                        <td>{workerName(m.user_id)}</td>
                        <td><StatusChip status="missing" /></td>
                        <td>—</td>
                        <td>—</td>
                        <td>—</td>
                        <td className="py-1">
                          <Button size="sm" variant="outline" onClick={() => openEdit(undefined, m.user_id, m.work_date)}>
                            <Plus className="h-3 w-3 mr-1" />Create entry
                          </Button>
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
                            <span>{fmtTs(a.created_at)}</span>
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
          ) : (
            // Monthly view
            <div className="space-y-4">
              {Array.from(monthlyGroups.entries())
                .sort((a, b) => workerName(a[0]).localeCompare(workerName(b[0])))
                .map(([uid, monthsMap]) => (
                  <Card key={uid}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{workerName(uid)}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Array.from(monthsMap.entries())
                        .sort((a, b) => b[0].localeCompare(a[0]))
                        .map(([ym, list]) => {
                          const total = list.reduce((s, r) => s + (Number(r.total_hours) || 0), 0);
                          const submittedDates = new Set(list.map(r => r.work_date));
                          const expected = expectedWeekdaysInMonth(ym);
                          const missing = Math.max(0, expected - submittedDates.size);
                          return (
                            <details key={ym} open className="border rounded">
                              <summary className="cursor-pointer flex flex-wrap items-center gap-3 px-3 py-2 bg-muted/40 text-sm">
                                <span className="font-semibold">{monthLabel(ym)}</span>
                                <Badge variant="outline">{total.toFixed(2)}h</Badge>
                                <Badge variant="outline">{list.length} entries</Badge>
                                <Badge variant="outline">{expected} expected</Badge>
                                {missing > 0 && <Badge className="bg-rose-600 text-white">{missing} missing</Badge>}
                              </summary>
                              <div className="overflow-auto">
                                <table className="w-full text-sm">
                                  <thead className="text-left text-muted-foreground border-b">
                                    <tr>
                                      <th className="py-2 w-8"></th>
                                      <th>Date</th><th>Status</th><th>Hours</th><th>Range</th><th>Updated</th><th></th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {list
                                      .slice()
                                      .sort((a, b) => b.work_date.localeCompare(a.work_date))
                                      .map(r => {
                                        const aCount = auditCounts[r.id] || 0;
                                        return (
                                          <tr key={r.id} className="border-b hover:bg-muted/30">
                                            <td className="py-1">
                                              <Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggleSelected(r.id)} />
                                            </td>
                                            <td className="py-1 font-mono">{fmtDate(r.work_date)}</td>
                                            <td><StatusChip status={r.status} locked={r.locked} /></td>
                                            <td>{Number(r.total_hours).toFixed(2)}h</td>
                                            <td>{r.start_time ? `${fmtTime(r.start_time)}–${fmtTime(r.end_time)}` : '—'}</td>
                                            <td className="text-xs text-muted-foreground">
                                              {fmtTs(r.updated_at)}
                                              {aCount > 1 && <span className="ml-2 text-[10px] text-primary">edited {aCount}x</span>}
                                            </td>
                                            <td className="flex gap-1 py-1">
                                              <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-3 w-3" /></Button>
                                              {r.locked && <Button size="sm" variant="ghost" onClick={() => onUnlock(r.id)}><Unlock className="h-3 w-3" /></Button>}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                  </tbody>
                                </table>
                              </div>
                            </details>
                          );
                        })}
                    </CardContent>
                  </Card>
                ))}
              {monthlyGroups.size === 0 && (
                <Card><CardContent className="pt-6 text-sm text-muted-foreground">No entries in range.</CardContent></Card>
              )}
            </div>
          )}
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
