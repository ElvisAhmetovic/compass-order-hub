import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { fetchWorkHours, upsertWorkHour, bulkUpsertWorkHours, WorkHourEntry } from '@/services/workHoursService';
import {
  fetchMyEntries,
  submitMyHours,
  adminUnlock,
  adminUpsert,
  isSuperAdminEmail,
  companyTodayISO,
  WorkHourV2,
} from '@/services/workHoursV2Service';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Wand2, UserCheck, UserX, Lock, Unlock, CheckCircle2 } from 'lucide-react';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface WorkHoursTableProps {
  userId: string;
  month: number;
  year: number;
}

const getWeekdays = (year: number, month: number) => {
  const days: Date[] = [];
  const lastDay = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= lastDay; d++) {
    const date = new Date(year, month, d);
    const dow = date.getDay();
    if (dow !== 0 && dow !== 6) days.push(date);
  }
  return days;
};

const formatDate = (d: Date) =>
  `${DAY_NAMES[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;

const toIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Parse "12:00-13:00h" / "12:00-13:00" / "60" into minutes.
const parseBreakMinutes = (raw?: string | null): number => {
  if (!raw) return 0;
  const s = raw.trim().replace(/h$/i, '');
  const m = s.match(/^(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})$/);
  if (m) {
    const start = parseInt(m[1]) * 60 + parseInt(m[2]);
    const end = parseInt(m[3]) * 60 + parseInt(m[4]);
    return Math.max(0, end - start);
  }
  const num = parseInt(s, 10);
  return Number.isFinite(num) && num >= 0 ? num : 0;
};

const normalizeTime = (raw?: string | null): string | null => {
  if (!raw) return null;
  const s = raw.trim().replace(/h$/i, '');
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  return `${m[1].padStart(2, '0')}:${m[2]}:00`;
};

const timeToHHMM = (t?: string | null): string => (t ? t.slice(0, 5) : '');

const WorkHoursTable = ({ userId, month, year }: WorkHoursTableProps) => {
  const { user } = useAuth();
  const isSuper = isSuperAdminEmail((user as any)?.email);
  const isOwnSheet = user?.id === userId;

  const [rows, setRows] = useState<Record<string, WorkHourEntry>>({});
  const [v2Map, setV2Map] = useState<Record<string, WorkHourV2>>({});
  const [loading, setLoading] = useState(true);
  const [filling, setFilling] = useState(false);
  const [busyDay, setBusyDay] = useState<string | null>(null);

  const weekdays = getWeekdays(year, month);
  const today = companyTodayISO();

  // Build display entry: V2 wins, fallback to legacy for fields V2 doesn't carry (e.g. break range text).
  // A V2 row with status='not_submitted' (auto-locked miss) must NOT render as worked — show empty fields.
  const buildEntry = useCallback((iso: string, legacy: Record<string, WorkHourEntry>, v2m: Record<string, WorkHourV2>): WorkHourEntry => {
    const legacyRow = legacy[iso];
    const v2 = v2m[iso];
    if (v2) {
      const isAbsent = v2.status === 'not_worked';
      const isMissed = v2.status === 'not_submitted';
      if (isMissed) {
        // Don't surface any legacy fallback — missed day stays visually empty.
        return {
          user_id: userId, date: iso,
          start_time: null, break_time: null, working_hours: null, end_time: null,
          note: null, absent: false,
        };
      }
      return {
        user_id: userId,
        date: iso,
        start_time: timeToHHMM(v2.start_time) || legacyRow?.start_time || null,
        // Prefer legacy break_time text when minutes match (preserves "12:00-13:00h" display).
        break_time:
          legacyRow?.break_time && parseBreakMinutes(legacyRow.break_time) === (v2.break_minutes || 0)
            ? legacyRow.break_time
            : (v2.break_minutes ? String(v2.break_minutes) : (legacyRow?.break_time || null)),
        working_hours: isAbsent ? 0 : (Number(v2.total_hours) || legacyRow?.working_hours || null),
        end_time: timeToHHMM(v2.end_time) || legacyRow?.end_time || null,
        note: v2.worker_note || legacyRow?.note || null,
        absent: isAbsent,
      };
    }
    return legacyRow || {
      user_id: userId, date: iso, start_time: null, break_time: null, working_hours: null, end_time: null, note: null, absent: false,
    };
  }, [userId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const monthStartIso = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const [data, v2] = await Promise.all([
        fetchWorkHours(userId, year, month),
        fetchMyEntries(userId, monthStartIso).catch(() => []),
      ]);
      const map: Record<string, WorkHourEntry> = {};
      data?.forEach((r: any) => { map[r.date] = r; });
      setRows(map);
      const v2m: Record<string, WorkHourV2> = {};
      (v2 || []).forEach(r => { v2m[r.work_date] = r; });
      setV2Map(v2m);
    } catch (e: any) {
      toast({ title: 'Error loading work hours', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [userId, year, month]);

  useEffect(() => { load(); }, [load]);

  const getEntry = (iso: string): WorkHourEntry => buildEntry(iso, rows, v2Map);

  // Persist a single field. Super admin -> V2 (authoritative). Otherwise legacy table.
  const save = async (iso: string, field: keyof WorkHourEntry, value: string | number | boolean | null) => {
    const current = getEntry(iso);
    const next = { ...current, [field]: value, user_id: userId, date: iso };

    if (isSuper) {
      try {
        const isAbsent = !!next.absent;
        const row = await adminUpsert({
          user_id: userId,
          work_date: iso,
          total_hours: isAbsent ? 0 : (Number(next.working_hours) || 0),
          start_time: normalizeTime(next.start_time),
          end_time: normalizeTime(next.end_time),
          break_minutes: parseBreakMinutes(next.break_time),
          status: isAbsent ? 'not_worked' : 'admin_override',
          locked: v2Map[iso]?.locked ?? false,
          admin_note: v2Map[iso]?.admin_note ?? null,
          reason: 'Admin edit from Work Hours sheet',
        });
        setV2Map(prev => ({ ...prev, [iso]: row }));
        // Keep legacy table in sync so break_time text persists for display.
        upsertWorkHour(next).catch(() => {});
        setRows(prev => ({ ...prev, [iso]: next }));
      } catch (e: any) {
        toast({ title: 'Save error', description: e.message, variant: 'destructive' });
      }
      return;
    }

    try {
      await upsertWorkHour(next);
      setRows(prev => ({ ...prev, [iso]: next }));
    } catch (e: any) {
      toast({ title: 'Save error', description: e.message, variant: 'destructive' });
    }
  };

  const toggleAbsent = async (iso: string) => {
    const entry = getEntry(iso);
    const newAbsent = !entry.absent;
    await save(iso, 'absent', newAbsent);
  };

  const handleSubmitDay = async (iso: string) => {
    const entry = getEntry(iso);
    if (entry.working_hours == null) {
      toast({ title: 'Fill hours first', description: 'Enter start, break, hours, end before submitting.', variant: 'destructive' });
      return;
    }

    setBusyDay(iso);
    try {
      // Super admin can submit/lock ANY user's ANY date via V2 admin RPC.
      if (isSuper) {
        const row = await adminUpsert({
          user_id: userId,
          work_date: iso,
          total_hours: Number(entry.working_hours) || 0,
          start_time: normalizeTime(entry.start_time),
          end_time: normalizeTime(entry.end_time),
          break_minutes: parseBreakMinutes(entry.break_time),
          status: 'admin_override',
          locked: true,
          admin_note: v2Map[iso]?.admin_note ?? null,
          reason: 'Admin submit & lock from Work Hours sheet',
        });
        setV2Map(prev => ({ ...prev, [iso]: row }));
        upsertWorkHour({ ...entry, user_id: userId, date: iso }).catch(() => {});
        toast({ title: 'Day submitted & locked', description: `${iso} saved.` });
        return;
      }

      // Worker submitting their own today.
      if (!isOwnSheet) {
        toast({ title: 'Not allowed', description: 'You can only submit your own day.', variant: 'destructive' });
        return;
      }
      if (iso !== today) {
        toast({ title: 'Only today can be submitted', description: 'Contact admin for past days.', variant: 'destructive' });
        return;
      }
      const row = await submitMyHours({
        total_hours: Number(entry.working_hours) || 0,
        start_time: normalizeTime(entry.start_time),
        end_time: normalizeTime(entry.end_time),
        break_minutes: parseBreakMinutes(entry.break_time),
        worker_note: entry.note || null,
      });
      setV2Map(prev => ({ ...prev, [iso]: row }));
      toast({ title: 'Day submitted & locked', description: `${iso} sent to Work Hours Admin.` });
    } catch (e: any) {
      toast({ title: 'Submit failed', description: e.message, variant: 'destructive' });
    } finally {
      setBusyDay(null);
    }
  };

  const handleUnlockDay = async (iso: string) => {
    const v2 = v2Map[iso];
    if (!v2) return;
    const reason = window.prompt('Reason for unlocking this day:');
    if (!reason || !reason.trim()) return;
    setBusyDay(iso);
    try {
      const row = await adminUnlock(v2.id, reason.trim());
      setV2Map(prev => ({ ...prev, [iso]: row }));
      toast({ title: 'Day unlocked', description: `${iso} can now be re-submitted.` });
    } catch (e: any) {
      toast({ title: 'Unlock failed', description: e.message, variant: 'destructive' });
    } finally {
      setBusyDay(null);
    }
  };

  const [fillProgress, setFillProgress] = useState<{ done: number; total: number } | null>(null);

  const handleAutoFill = async () => {
    setFilling(true);
    setFillProgress(null);
    try {
      // Candidate weekdays: not future, not already submitted/locked.
      const candidates = weekdays
        .map(d => toIso(d))
        .filter(iso => {
          if (iso > today) return false;
          const v2 = v2Map[iso];
          if (!v2) return true;
          if (v2.locked) return false;
          if (v2.status === 'admin_override' || v2.status === 'submitted' || v2.status === 'not_worked') return false;
          return true; // 'not_submitted' (missed) eligible for super-admin override
        });

      if (candidates.length === 0) {
        toast({ title: 'Nothing to fill', description: 'All weekdays already submitted, locked, or in the future.' });
        return;
      }

      // 1. Fill legacy work_hours (preserves break-text display).
      const legacyEntries: WorkHourEntry[] = candidates.map(iso => ({
        user_id: userId,
        date: iso,
        start_time: '09:00',
        break_time: '12:00-13:00h',
        working_hours: 6.5,
        end_time: '17:00',
        note: null,
        absent: false,
      }));
      await bulkUpsertWorkHours(legacyEntries);
      const newRows = { ...rows };
      legacyEntries.forEach(e => { newRows[e.date] = e; });
      setRows(newRows);

      // 2. Submit & lock in V2 sequentially.
      const newV2: Record<string, WorkHourV2> = {};
      let lockedCount = 0;
      let failedCount = 0;
      let skippedWorkerPast = 0;

      setFillProgress({ done: 0, total: candidates.length });

      for (let i = 0; i < candidates.length; i++) {
        const iso = candidates[i];
        try {
          if (isSuper) {
            const row = await adminUpsert({
              user_id: userId,
              work_date: iso,
              total_hours: 6.5,
              start_time: '09:00:00',
              end_time: '17:00:00',
              break_minutes: 60,
              status: 'admin_override',
              locked: true,
              admin_note: v2Map[iso]?.admin_note ?? null,
              reason: 'Auto-fill month from Work Hours sheet',
            });
            newV2[iso] = row;
            lockedCount++;
          } else if (isOwnSheet && iso === today) {
            const row = await submitMyHours({
              total_hours: 6.5,
              start_time: '09:00:00',
              end_time: '17:00:00',
              break_minutes: 60,
              worker_note: null,
            });
            newV2[iso] = row;
            lockedCount++;
          } else {
            skippedWorkerPast++;
          }
        } catch {
          failedCount++;
        }
        setFillProgress({ done: i + 1, total: candidates.length });
      }

      if (Object.keys(newV2).length) {
        setV2Map(prev => ({ ...prev, ...newV2 }));
      }

      const parts = [`Filled ${candidates.length} day${candidates.length === 1 ? '' : 's'}`];
      if (lockedCount) parts.push(`locked ${lockedCount}`);
      if (skippedWorkerPast) parts.push(`${skippedWorkerPast} past day${skippedWorkerPast === 1 ? '' : 's'} need admin to lock`);
      if (failedCount) parts.push(`${failedCount} failed`);
      toast({
        title: 'Auto-fill complete',
        description: parts.join(' · '),
        variant: failedCount ? 'destructive' : 'default',
      });
    } catch (e: any) {
      toast({ title: 'Auto-fill error', description: e.message, variant: 'destructive' });
    } finally {
      setFilling(false);
      setFillProgress(null);
    }
  };

  const totalHours = weekdays.reduce((sum, d) => {
    const iso = toIso(d);
    const v2 = v2Map[iso];
    // Exclude auto-locked "missed" rows from totals — they aren't real worked hours.
    if (v2 && v2.status === 'not_submitted') return sum;
    const e = getEntry(iso);
    return sum + (e.absent ? 0 : (Number(e.working_hours) || 0));
  }, 0);

  const canAutoFill = isOwnSheet || isSuper;

  if (loading) return <div className="py-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div>
      <div className="flex justify-end mb-3">
        {canAutoFill && (
          <Button
            onClick={handleAutoFill}
            disabled={filling}
            variant="outline"
            size="sm"
            title="Fill weekdays with 09:00 / 12:00–13:00h / 6.5h / 17:00 and submit & lock each day"
          >
            <Wand2 className="h-4 w-4 mr-1" />
            {filling
              ? (fillProgress ? `Filling ${fillProgress.done}/${fillProgress.total}…` : 'Filling…')
              : 'Auto-Fill Month'}
          </Button>
        )}
      </div>
      <div className="border rounded-lg overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead className="w-[80px]">Submit</TableHead>
            <TableHead className="w-[44px]">Abs.</TableHead>
            <TableHead className="w-[200px]">Date</TableHead>
            <TableHead className="w-[100px]">Start</TableHead>
            <TableHead className="w-[140px]">Break</TableHead>
            <TableHead className="w-[100px]">Hours</TableHead>
            <TableHead className="w-[100px]">End</TableHead>
            <TableHead>Note</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {weekdays.map((day, idx) => {
            const iso = toIso(day);
            const entry = getEntry(iso);
            const isAbsent = entry.absent;
            const isVacation = !isAbsent && (entry.note?.toUpperCase().includes('GODISNJI') || entry.note?.toUpperCase().includes('GODIŠNJI'));
            const v2 = v2Map[iso];
            const isMissed = !!v2 && v2.status === 'not_submitted';
            // Treat auto-locked "missed" rows as NOT locked/submitted for UI purposes — show as Missed only.
            const isLocked = !!v2?.locked && !isMissed;
            const isSubmitted = !!v2 && v2.status !== 'not_submitted';
            const busy = busyDay === iso;
            const isPast = iso < today;
            const isFuture = iso > today;
            const fieldsDisabled = !isSuper && (isLocked || isPast || isFuture);
            const lockedTitle = !fieldsDisabled
              ? undefined
              : isLocked
                ? 'Locked — contact admin to unlock'
                : isPast
                  ? 'Past day — contact admin to edit'
                  : 'Not yet — only today can be edited';

            return (
              <TableRow key={iso} className={cn(
                isAbsent && 'bg-red-50 dark:bg-red-950/30',
                isVacation && !isAbsent && 'bg-green-50 dark:bg-green-950/30',
                isLocked && 'bg-emerald-50 dark:bg-emerald-950/30',
                isMissed && 'bg-red-50/60 dark:bg-red-950/20',
              )}>
                <TableCell className="text-muted-foreground text-sm">{idx + 1}</TableCell>
                <TableCell className="px-1">
                  {isMissed ? (
                    <span title="Missed 12:00 submission deadline" className="inline-flex items-center text-destructive text-[10px] font-semibold uppercase">
                      Missed
                    </span>
                  ) : isLocked ? (
                    <div className="flex items-center gap-1">
                      <span title={`Locked: ${v2?.locked_reason || ''}`} className="inline-flex items-center text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <Lock className="h-3 w-3 ml-0.5" />
                      </span>
                      {isSuper && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleUnlockDay(iso)}
                          className="rounded-md p-1 text-amber-600 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/30 disabled:opacity-50"
                          title="Admin unlock"
                        >
                          <Unlock className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleSubmitDay(iso)}
                      className={cn(
                        'rounded-md p-1 transition-colors disabled:opacity-50',
                        isSubmitted
                          ? 'text-emerald-600 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-900/30'
                          : 'text-muted-foreground hover:bg-accent'
                      )}
                      title={iso === today || isSuper ? 'Submit & lock day' : 'Only today can be submitted'}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                  )}
                </TableCell>
                <TableCell className="px-1">
                  <button
                    type="button"
                    onClick={() => toggleAbsent(iso)}
                    disabled={fieldsDisabled}
                    className={cn(
                      'rounded-md p-1 transition-colors',
                      isAbsent
                        ? 'text-destructive hover:bg-destructive/10'
                        : 'text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30',
                      fieldsDisabled && 'opacity-50 cursor-not-allowed hover:bg-transparent dark:hover:bg-transparent'
                    )}
                    title={fieldsDisabled ? lockedTitle : (isAbsent ? 'Mark as present' : 'Mark as absent')}
                  >
                    {isAbsent ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                  </button>
                </TableCell>
                <TableCell className="text-sm font-medium">{formatDate(day)}</TableCell>
                <TableCell>
                  <Input
                    key={`start-${iso}-${entry.start_time ?? ''}`}
                    className="h-8 text-sm"
                    placeholder="09:00"
                    defaultValue={entry.start_time || ''}
                    disabled={fieldsDisabled}
                    title={lockedTitle}
                    onBlur={e => save(iso, 'start_time', e.target.value || null)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    key={`break-${iso}-${entry.break_time ?? ''}`}
                    className="h-8 text-sm"
                    placeholder="12:00-13:00h"
                    defaultValue={entry.break_time || ''}
                    disabled={fieldsDisabled}
                    title={lockedTitle}
                    onBlur={e => save(iso, 'break_time', e.target.value || null)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    key={`hours-${iso}-${entry.working_hours ?? ''}`}
                    className="h-8 text-sm"
                    type="number"
                    step="0.5"
                    placeholder="8"
                    defaultValue={entry.working_hours ?? ''}
                    disabled={fieldsDisabled}
                    title={lockedTitle}
                    onBlur={e => save(iso, 'working_hours', e.target.value ? parseFloat(e.target.value) : null)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    key={`end-${iso}-${entry.end_time ?? ''}`}
                    className="h-8 text-sm"
                    placeholder="17:00h"
                    defaultValue={entry.end_time || ''}
                    disabled={fieldsDisabled}
                    title={lockedTitle}
                    onBlur={e => save(iso, 'end_time', e.target.value || null)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    key={`note-${iso}-${entry.note ?? ''}`}
                    className="h-8 text-sm"
                    placeholder="e.g. VACATION"
                    defaultValue={entry.note || ''}
                    disabled={fieldsDisabled}
                    title={lockedTitle}
                    onBlur={e => save(iso, 'note', e.target.value || null)}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={6} className="text-right font-semibold">Total Hours:</TableCell>
            <TableCell className="font-bold text-lg">{totalHours}</TableCell>
            <TableCell colSpan={2} />
          </TableRow>
        </TableFooter>
      </Table>
      </div>
    </div>
  );
};

export default WorkHoursTable;
