import { supabase } from '@/integrations/supabase/client';

export interface WorkHourEntry {
  id?: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  start_time: string | null;
  break_time: string | null;
  working_hours: number | null;
  end_time: string | null;
  note: string | null;
  absent: boolean;
}

export const fetchWorkHours = async (userId: string, year: number, month: number) => {
  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('work_hours')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) throw error;
  return data;
};

export const upsertWorkHour = async (entry: WorkHourEntry) => {
  const { data, error } = await supabase
    .from('work_hours')
    .upsert(
      {
        user_id: entry.user_id,
        date: entry.date,
        start_time: entry.start_time,
        break_time: entry.break_time,
        working_hours: entry.working_hours,
        end_time: entry.end_time,
        note: entry.note,
        absent: entry.absent,
      },
      { onConflict: 'user_id,date' }
    )
    .select();

  if (error) throw error;
  return data?.[0];
};

export const bulkUpsertWorkHours = async (entries: WorkHourEntry[]) => {
  if (entries.length === 0) return [];
  const { data, error } = await supabase
    .from('work_hours')
    .upsert(
      entries.map(e => ({
        user_id: e.user_id,
        date: e.date,
        start_time: e.start_time,
        break_time: e.break_time,
        working_hours: e.working_hours,
        end_time: e.end_time,
        note: e.note,
        absent: e.absent ?? false,
      })),
      { onConflict: 'user_id,date' }
    )
    .select();
  if (error) throw error;
  return data;
};

export const fetchAllUsers = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, role, nickname')
    .in('role', ['admin', 'agent'])
    .order('first_name');

  if (error) throw error;
  return data;
};
