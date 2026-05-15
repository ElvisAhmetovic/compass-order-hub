import { supabase } from '@/integrations/supabase/client';

export type WhStatus = 'submitted' | 'not_submitted' | 'not_worked' | 'admin_override';

export interface WorkHourV2 {
  id: string;
  user_id: string;
  worker_email: string | null;
  work_date: string;
  start_time: string | null;
  end_time: string | null;
  break_minutes: number | null;
  total_hours: number;
  status: WhStatus;
  locked: boolean;
  locked_reason: string | null;
  locked_at: string | null;
  submitted_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string;
  admin_override_by: string | null;
  admin_override_at: string | null;
  admin_note: string | null;
  worker_note: string | null;
}

export interface WhAuditRow {
  id: string;
  work_hours_id: string | null;
  worker_id: string | null;
  worker_email: string | null;
  action: string;
  changed_by_user_id: string | null;
  changed_by_email: string | null;
  changed_by_role: string | null;
  old_values: any;
  new_values: any;
  reason: string | null;
  source: string;
  created_at: string;
}

const TZ = 'Europe/Sarajevo';

export const companyTodayISO = (): string => {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  });
  return fmt.format(new Date());
};

export const companyNowParts = () => {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  const [h, m, s] = fmt.format(new Date()).split(':').map(Number);
  return { h, m, s };
};

export const isBeforeDeadline = () => {
  const { h } = companyNowParts();
  return h < 12;
};

export const WH_SUPER_ADMIN_EMAILS = [
  'luciferbebistar@gmail.com',
  'kontakt.abmedia@gmail.com',
  'kleinabmedia@gmail.com',
  'thomas.thomasklein@gmail.com',
  'business@team-abmedia.com',
] as const;

export const isSuperAdminEmail = (email?: string | null) =>
  WH_SUPER_ADMIN_EMAILS.includes(((email || '').toLowerCase()) as any);

export const fetchMyEntries = async (userId: string, fromDate: string) => {
  const { data, error } = await (supabase as any)
    .from('work_hours_v2')
    .select('*')
    .eq('user_id', userId)
    .gte('work_date', fromDate)
    .order('work_date', { ascending: false });
  if (error) throw error;
  return (data || []) as WorkHourV2[];
};

export const fetchAllEntries = async (fromDate: string, toDate: string) => {
  const { data, error } = await (supabase as any)
    .from('work_hours_v2')
    .select('*')
    .gte('work_date', fromDate)
    .lte('work_date', toDate)
    .order('work_date', { ascending: false });
  if (error) throw error;
  return (data || []) as WorkHourV2[];
};

export const fetchAudit = async (workHoursId: string) => {
  const { data, error } = await (supabase as any)
    .from('work_hours_audit_log')
    .select('*')
    .eq('work_hours_id', workHoursId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as WhAuditRow[];
};

export const submitMyHours = async (params: {
  total_hours: number;
  start_time?: string | null;
  end_time?: string | null;
  break_minutes?: number;
  worker_note?: string | null;
}) => {
  const { data, error } = await (supabase as any).rpc('wh_submit', {
    p_total_hours: params.total_hours,
    p_start_time: params.start_time || null,
    p_end_time: params.end_time || null,
    p_break_minutes: params.break_minutes ?? 0,
    p_worker_note: params.worker_note || null,
  });
  if (error) throw error;
  return data as WorkHourV2;
};

export const adminUpsert = async (params: {
  user_id: string;
  work_date: string;
  total_hours: number;
  start_time?: string | null;
  end_time?: string | null;
  break_minutes?: number;
  status?: WhStatus;
  locked?: boolean;
  admin_note?: string | null;
  reason: string;
}) => {
  const { data, error } = await (supabase as any).rpc('wh_admin_upsert', {
    p_user_id: params.user_id,
    p_work_date: params.work_date,
    p_total_hours: params.total_hours,
    p_start_time: params.start_time || null,
    p_end_time: params.end_time || null,
    p_break_minutes: params.break_minutes ?? 0,
    p_status: params.status || 'admin_override',
    p_locked: params.locked ?? false,
    p_admin_note: params.admin_note || null,
    p_reason: params.reason,
  });
  if (error) throw error;
  return data as WorkHourV2;
};

export const adminUnlock = async (id: string, reason: string) => {
  const { data, error } = await (supabase as any).rpc('wh_admin_unlock', {
    p_id: id, p_reason: reason,
  });
  if (error) throw error;
  return data as WorkHourV2;
};

export const triggerAutoLock = async () => {
  await (supabase as any).rpc('wh_auto_lock_today');
};

export const fetchWorkers = async () => {
  const { data, error } = await (supabase as any)
    .from('profiles')
    .select('id, first_name, last_name, role')
    .in('role', ['admin', 'agent'])
    .order('first_name');
  if (error) throw error;
  return data as Array<{ id: string; first_name: string | null; last_name: string | null; role: string }>;
};

export const adminBulkSetLock = async (ids: string[], lock: boolean, reason: string) => {
  const { data, error } = await (supabase as any).rpc('wh_admin_bulk_set_lock', {
    p_ids: ids, p_lock: lock, p_reason: reason,
  });
  if (error) throw error;
  return (data as number) || 0;
};

export const fetchAuditCounts = async (workHoursIds: string[]): Promise<Record<string, number>> => {
  if (!workHoursIds.length) return {};
  const { data, error } = await (supabase as any)
    .from('work_hours_audit_log')
    .select('work_hours_id')
    .in('work_hours_id', workHoursIds);
  if (error) throw error;
  const out: Record<string, number> = {};
  (data || []).forEach((r: any) => {
    if (r.work_hours_id) out[r.work_hours_id] = (out[r.work_hours_id] || 0) + 1;
  });
  return out;
};

export const subscribeAllEntries = (
  fromDate: string,
  toDate: string,
  onChange: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; new: WorkHourV2 | null; old: WorkHourV2 | null }) => void,
) => {
  const channel = (supabase as any)
    .channel(`wh-admin-${fromDate}-${toDate}-${Math.random().toString(36).slice(2, 8)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'work_hours_v2' }, (payload: any) => {
      const row = (payload.new || payload.old) as WorkHourV2 | null;
      if (row?.work_date && (row.work_date < fromDate || row.work_date > toDate)) return;
      onChange({ eventType: payload.eventType, new: payload.new || null, old: payload.old || null });
    })
    .subscribe();
  return () => { try { channel.unsubscribe(); } catch {} };
};

export const fetchLateCountToday = async (): Promise<number> => {
  const today = companyTodayISO();
  const [workersRes, submittedRes] = await Promise.all([
    (supabase as any).from('profiles').select('id', { count: 'exact', head: true }).in('role', ['admin', 'agent']),
    (supabase as any).from('work_hours_v2').select('user_id', { count: 'exact', head: true }).eq('work_date', today),
  ]);
  const total = workersRes.count ?? 0;
  const submitted = submittedRes.count ?? 0;
  return Math.max(0, total - submitted);
};
