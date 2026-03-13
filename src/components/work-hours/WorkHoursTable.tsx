import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { fetchWorkHours, upsertWorkHour, bulkUpsertWorkHours, WorkHourEntry } from '@/services/workHoursService';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Wand2, UserCheck, UserX } from 'lucide-react';

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

const WorkHoursTable = ({ userId, month, year }: WorkHoursTableProps) => {
  const [rows, setRows] = useState<Record<string, WorkHourEntry>>({});
  const [loading, setLoading] = useState(true);
  const [filling, setFilling] = useState(false);

  const weekdays = getWeekdays(year, month);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchWorkHours(userId, year, month);
      const map: Record<string, WorkHourEntry> = {};
      data?.forEach((r: any) => { map[r.date] = r; });
      setRows(map);
    } catch (e: any) {
      toast({ title: 'Error loading work hours', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [userId, year, month]);

  useEffect(() => { load(); }, [load]);

  const getEntry = (iso: string): WorkHourEntry => rows[iso] || {
    user_id: userId, date: iso, start_time: null, break_time: null, working_hours: null, end_time: null, note: null, absent: false,
  };

  const save = async (iso: string, field: keyof WorkHourEntry, value: string | number | boolean | null) => {
    const entry = { ...getEntry(iso), [field]: value };
    entry.user_id = userId;
    try {
      await upsertWorkHour(entry);
      setRows(prev => ({ ...prev, [iso]: entry }));
    } catch (e: any) {
      toast({ title: 'Save error', description: e.message, variant: 'destructive' });
    }
  };

  const toggleAbsent = async (iso: string) => {
    const entry = getEntry(iso);
    const newAbsent = !entry.absent;
    await save(iso, 'absent', newAbsent);
  };

  const handleAutoFill = async () => {
    setFilling(true);
    try {
      const entriesToFill: WorkHourEntry[] = weekdays
        .map(day => toIso(day))
        .filter(iso => !rows[iso])
        .map(iso => ({
          user_id: userId,
          date: iso,
          start_time: '09:00',
          break_time: '12:00-13:00h',
          working_hours: 6.5,
          end_time: '17:00',
          note: null,
          absent: false,
        }));

      if (entriesToFill.length === 0) {
        toast({ title: 'All days already have data', description: 'Nothing to fill.' });
        setFilling(false);
        return;
      }

      await bulkUpsertWorkHours(entriesToFill);
      const newRows = { ...rows };
      entriesToFill.forEach(e => { newRows[e.date] = e; });
      setRows(newRows);
      toast({ title: 'Auto-filled successfully', description: `${entriesToFill.length} days filled with default hours.` });
    } catch (e: any) {
      toast({ title: 'Auto-fill error', description: e.message, variant: 'destructive' });
    } finally {
      setFilling(false);
    }
  };

  const totalHours = Object.values(rows).reduce((sum, r) => sum + (r.absent ? 0 : (r.working_hours || 0)), 0);

  if (loading) return <div className="py-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Button onClick={handleAutoFill} disabled={filling} variant="outline" size="sm">
          <Wand2 className="h-4 w-4 mr-1" />
          {filling ? 'Filling...' : 'Auto-Fill Month'}
        </Button>
      </div>
      <div className="border rounded-lg overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead className="w-[44px]"></TableHead>
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

            return (
              <TableRow key={iso} className={cn(
                isAbsent && 'bg-red-50 dark:bg-red-950/30',
                isVacation && !isAbsent && 'bg-green-50 dark:bg-green-950/30',
              )}>
                <TableCell className="text-muted-foreground text-sm">{idx + 1}</TableCell>
                <TableCell className="px-1">
                  <button
                    type="button"
                    onClick={() => toggleAbsent(iso)}
                    className={cn(
                      'rounded-md p-1 transition-colors',
                      isAbsent
                        ? 'text-destructive hover:bg-destructive/10'
                        : 'text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30'
                    )}
                    title={isAbsent ? 'Mark as present' : 'Mark as absent'}
                  >
                    {isAbsent ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                  </button>
                </TableCell>
                <TableCell className="text-sm font-medium">{formatDate(day)}</TableCell>
                <TableCell>
                  <Input
                    className="h-8 text-sm"
                    placeholder="09:00"
                    defaultValue={entry.start_time || ''}
                    onBlur={e => save(iso, 'start_time', e.target.value || null)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    className="h-8 text-sm"
                    placeholder="12:00-13:00h"
                    defaultValue={entry.break_time || ''}
                    onBlur={e => save(iso, 'break_time', e.target.value || null)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    className="h-8 text-sm"
                    type="number"
                    step="0.5"
                    placeholder="8"
                    defaultValue={entry.working_hours ?? ''}
                    onBlur={e => save(iso, 'working_hours', e.target.value ? parseFloat(e.target.value) : null)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    className="h-8 text-sm"
                    placeholder="17:00h"
                    defaultValue={entry.end_time || ''}
                    onBlur={e => save(iso, 'end_time', e.target.value || null)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    className="h-8 text-sm"
                    placeholder="e.g. VACATION"
                    defaultValue={entry.note || ''}
                    onBlur={e => save(iso, 'note', e.target.value || null)}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={5} className="text-right font-semibold">Total Hours:</TableCell>
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
