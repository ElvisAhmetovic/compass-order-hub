import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { fetchWorkHours, upsertWorkHour, WorkHourEntry } from '@/services/workHoursService';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const DAY_NAMES = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

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
  `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;

const toIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const WorkHoursTable = ({ userId, month, year }: WorkHoursTableProps) => {
  const [rows, setRows] = useState<Record<string, WorkHourEntry>>({});
  const [loading, setLoading] = useState(true);

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
    user_id: userId, date: iso, start_time: null, break_time: null, working_hours: null, end_time: null, note: null,
  };

  const save = async (iso: string, field: keyof WorkHourEntry, value: string | number | null) => {
    const entry = { ...getEntry(iso), [field]: value };
    entry.user_id = userId;
    try {
      await upsertWorkHour(entry);
      setRows(prev => ({ ...prev, [iso]: entry }));
    } catch (e: any) {
      toast({ title: 'Save error', description: e.message, variant: 'destructive' });
    }
  };

  const totalHours = Object.values(rows).reduce((sum, r) => sum + (r.working_hours || 0), 0);

  if (loading) return <div className="py-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="border rounded-lg overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Nr.</TableHead>
            <TableHead className="w-[40px]">Tag</TableHead>
            <TableHead className="w-[120px]">Datum</TableHead>
            <TableHead className="w-[100px]">Početak</TableHead>
            <TableHead className="w-[140px]">1 Pauza</TableHead>
            <TableHead className="w-[100px]">Radno Vrijeme</TableHead>
            <TableHead className="w-[100px]">Kraj</TableHead>
            <TableHead>Notiz</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {weekdays.map((day, idx) => {
            const iso = toIso(day);
            const entry = getEntry(iso);
            const isVacation = entry.note?.toUpperCase().includes('GODISNJI') || entry.note?.toUpperCase().includes('GODIŠNJI');

            return (
              <TableRow key={iso} className={cn(isVacation && 'bg-green-50 dark:bg-green-950/30')}>
                <TableCell className="text-muted-foreground text-sm">{idx + 1}</TableCell>
                <TableCell className="text-sm font-medium">{DAY_NAMES[day.getDay()]}</TableCell>
                <TableCell className="text-sm">{formatDate(day)}</TableCell>
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
                    placeholder="z.B. GODISNJI"
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
            <TableCell colSpan={5} className="text-right font-semibold">Gesamt Stunden:</TableCell>
            <TableCell className="font-bold text-lg">{totalHours}</TableCell>
            <TableCell colSpan={2} />
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};

export default WorkHoursTable;
