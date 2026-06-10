import { supabase } from "@/integrations/supabase/client";

export type SocialPlatform = "facebook" | "abm_website" | "instagram" | "tiktok" | "twitter";
export type ChecklistPriority = "low" | "medium" | "high";

export interface SocialChecklistItem {
  id: string;
  platform: SocialPlatform;
  checklist_date: string;
  title: string;
  description: string | null;
  link_url: string | null;
  scheduled_time: string | null;
  priority: ChecklistPriority;
  is_done: boolean;
  done_at: string | null;
  done_by: string | null;
  done_note: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // engagement
  likes: number | null;
  shares: number | null;
  comments: number | null;
  reach: number | null;
  impressions: number | null;
  performance_note: string | null;
  performance_recorded_at: string | null;
}

export interface CreateChecklistItemPayload {
  platform: SocialPlatform;
  checklist_date: string;
  title: string;
  description?: string | null;
  link_url?: string | null;
  scheduled_time?: string | null;
  priority?: ChecklistPriority;
}

const TABLE = "social_media_checklist_items" as const;

export async function listItems(platform: SocialPlatform, date: string): Promise<SocialChecklistItem[]> {
  const { data, error } = await (supabase as any)
    .from(TABLE)
    .select("*")
    .eq("platform", platform)
    .eq("checklist_date", date)
    .is("deleted_at", null)
    .order("scheduled_time", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as SocialChecklistItem[];
}

export async function listItemsRange(
  platform: SocialPlatform,
  fromDate: string,
  toDate: string,
): Promise<SocialChecklistItem[]> {
  const { data, error } = await (supabase as any)
    .from(TABLE)
    .select("*")
    .eq("platform", platform)
    .gte("checklist_date", fromDate)
    .lte("checklist_date", toDate)
    .is("deleted_at", null)
    .order("checklist_date", { ascending: true })
    .order("scheduled_time", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as SocialChecklistItem[];
}

export async function createItem(payload: CreateChecklistItemPayload): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Not authenticated");
  const { error } = await (supabase as any).from(TABLE).insert({
    platform: payload.platform,
    checklist_date: payload.checklist_date,
    title: payload.title,
    description: payload.description ?? null,
    link_url: payload.link_url ?? null,
    scheduled_time: payload.scheduled_time ?? null,
    priority: payload.priority ?? "medium",
    created_by: uid,
  });
  if (error) throw error;
}

export async function updateItem(id: string, patch: Partial<CreateChecklistItemPayload>): Promise<void> {
  const { error } = await (supabase as any).from(TABLE).update(patch).eq("id", id);
  if (error) throw error;
}

export async function rescheduleItem(id: string, newDate: string): Promise<void> {
  const { error } = await (supabase as any)
    .from(TABLE)
    .update({ checklist_date: newDate })
    .eq("id", id);
  if (error) throw error;
}

export async function duplicateItemToDate(item: SocialChecklistItem, newDate: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Not authenticated");
  const { error } = await (supabase as any).from(TABLE).insert({
    platform: item.platform,
    checklist_date: newDate,
    title: item.title,
    description: item.description,
    link_url: item.link_url,
    scheduled_time: item.scheduled_time,
    priority: item.priority,
    created_by: uid,
  });
  if (error) throw error;
}

export async function toggleDone(id: string, done: boolean, note?: string | null): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id ?? null;
  const patch = done
    ? { is_done: true, done_at: new Date().toISOString(), done_by: uid, done_note: note ?? null }
    : { is_done: false, done_at: null, done_by: null, done_note: null };
  const { error } = await (supabase as any).from(TABLE).update(patch).eq("id", id);
  if (error) throw error;
}

export async function softDelete(id: string): Promise<void> {
  const { error } = await (supabase as any)
    .from(TABLE)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

// ===== Performance =====
export interface PerformancePatch {
  likes?: number | null;
  shares?: number | null;
  comments?: number | null;
  reach?: number | null;
  impressions?: number | null;
  performance_note?: string | null;
}

export async function updatePerformance(id: string, patch: PerformancePatch): Promise<void> {
  const { error } = await (supabase as any)
    .from(TABLE)
    .update({ ...patch, performance_recorded_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

// ===== Templates =====

const TEMPLATES_TABLE = "social_media_checklist_templates" as const;

export interface ChecklistTemplate {
  id: string;
  platform: SocialPlatform;
  title: string;
  description: string | null;
  link_url: string | null;
  scheduled_time: string | null;
  priority: ChecklistPriority;
  sort_order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplatePayload {
  platform: SocialPlatform;
  title: string;
  description?: string | null;
  link_url?: string | null;
  scheduled_time?: string | null;
  priority?: ChecklistPriority;
  sort_order?: number;
}

export async function listTemplates(platform: SocialPlatform): Promise<ChecklistTemplate[]> {
  const { data, error } = await (supabase as any)
    .from(TEMPLATES_TABLE)
    .select("*")
    .eq("platform", platform)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ChecklistTemplate[];
}

export async function createTemplate(payload: CreateTemplatePayload): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Not authenticated");
  const { error } = await (supabase as any).from(TEMPLATES_TABLE).insert({
    platform: payload.platform,
    title: payload.title,
    description: payload.description ?? null,
    link_url: payload.link_url ?? null,
    scheduled_time: payload.scheduled_time ?? null,
    priority: payload.priority ?? "medium",
    sort_order: payload.sort_order ?? 0,
    created_by: uid,
  });
  if (error) throw error;
}

export async function updateTemplate(id: string, patch: Partial<CreateTemplatePayload>): Promise<void> {
  const { error } = await (supabase as any).from(TEMPLATES_TABLE).update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await (supabase as any).from(TEMPLATES_TABLE).delete().eq("id", id);
  if (error) throw error;
}

export async function applyTemplatesToDate(
  platform: SocialPlatform,
  date: string
): Promise<{ inserted: number }> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Not authenticated");
  const templates = await listTemplates(platform);
  if (templates.length === 0) return { inserted: 0 };
  const rows = templates.map((t) => ({
    platform,
    checklist_date: date,
    title: t.title,
    description: t.description,
    link_url: t.link_url,
    scheduled_time: t.scheduled_time,
    priority: t.priority,
    created_by: uid,
  }));
  const { error } = await (supabase as any).from(TABLE).insert(rows);
  if (error) throw error;
  return { inserted: rows.length };
}

// ===== Content ideas =====

const IDEAS_TABLE = "social_media_content_ideas" as const;

export type IdeaStatus = "open" | "used" | "archived";

export interface ContentIdea {
  id: string;
  platform: SocialPlatform;
  title: string;
  description: string | null;
  link_url: string | null;
  tags: string[];
  status: IdeaStatus;
  used_on_date: string | null;
  used_item_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateIdeaPayload {
  platform: SocialPlatform;
  title: string;
  description?: string | null;
  link_url?: string | null;
  tags?: string[];
}

export async function listIdeas(platform: SocialPlatform, status?: IdeaStatus): Promise<ContentIdea[]> {
  let q = (supabase as any).from(IDEAS_TABLE).select("*").eq("platform", platform);
  if (status) q = q.eq("status", status);
  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ContentIdea[];
}

export async function createIdea(payload: CreateIdeaPayload): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Not authenticated");
  const { error } = await (supabase as any).from(IDEAS_TABLE).insert({
    platform: payload.platform,
    title: payload.title,
    description: payload.description ?? null,
    link_url: payload.link_url ?? null,
    tags: payload.tags ?? [],
    created_by: uid,
  });
  if (error) throw error;
}

export async function updateIdea(id: string, patch: Partial<ContentIdea>): Promise<void> {
  const { error } = await (supabase as any).from(IDEAS_TABLE).update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteIdea(id: string): Promise<void> {
  const { error } = await (supabase as any).from(IDEAS_TABLE).delete().eq("id", id);
  if (error) throw error;
}

export async function useIdeaOnDate(idea: ContentIdea, date: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Not authenticated");
  const { data: inserted, error: insErr } = await (supabase as any)
    .from(TABLE)
    .insert({
      platform: idea.platform,
      checklist_date: date,
      title: idea.title,
      description: idea.description,
      link_url: idea.link_url,
      priority: "medium",
      created_by: uid,
    })
    .select("id");
  if (insErr) throw insErr;
  const newItemId = inserted?.[0]?.id ?? null;
  await (supabase as any)
    .from(IDEAS_TABLE)
    .update({ status: "used", used_on_date: date, used_item_id: newItemId })
    .eq("id", idea.id);
}

// ===== Best times =====

const BEST_TIMES_TABLE = "social_media_best_times" as const;

export interface BestTimeRow {
  id: string;
  platform: SocialPlatform;
  day_of_week: number;
  hour: number;
  source: "default" | "computed" | "manual";
  score: number;
  note: string | null;
}

export async function listBestTimes(platform: SocialPlatform): Promise<BestTimeRow[]> {
  const { data, error } = await (supabase as any)
    .from(BEST_TIMES_TABLE)
    .select("*")
    .eq("platform", platform)
    .order("day_of_week", { ascending: true })
    .order("hour", { ascending: true });
  if (error) throw error;
  return (data ?? []) as BestTimeRow[];
}

/** Compute average engagement per hour from past 90 days of items with metrics. */
export async function computeBestHoursFromData(
  platform: SocialPlatform,
): Promise<{ hour: number; avgEngagement: number; count: number }[]> {
  const since = new Date();
  since.setDate(since.getDate() - 90);
  const sinceStr = since.toISOString().slice(0, 10);
  const { data, error } = await (supabase as any)
    .from(TABLE)
    .select("scheduled_time, likes, shares, comments")
    .eq("platform", platform)
    .gte("checklist_date", sinceStr)
    .not("performance_recorded_at", "is", null)
    .not("scheduled_time", "is", null)
    .is("deleted_at", null);
  if (error) throw error;
  const buckets = new Map<number, { sum: number; count: number }>();
  for (const r of (data ?? []) as any[]) {
    const h = parseInt(String(r.scheduled_time).slice(0, 2), 10);
    if (Number.isNaN(h)) continue;
    const eng = (r.likes ?? 0) + (r.shares ?? 0) + (r.comments ?? 0);
    const b = buckets.get(h) ?? { sum: 0, count: 0 };
    b.sum += eng;
    b.count += 1;
    buckets.set(h, b);
  }
  return Array.from(buckets.entries())
    .map(([hour, { sum, count }]) => ({ hour, avgEngagement: sum / Math.max(count, 1), count }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement);
}

// ===== Platform-wide metrics =====

const PLATFORM_METRICS_TABLE = "social_media_platform_metrics" as const;

export type MetricPeriodType = "day" | "week" | "month";

export interface PlatformMetric {
  id: string;
  platform: SocialPlatform;
  period_type: MetricPeriodType;
  period_start: string;
  period_end: string;
  likes: number | null;
  shares: number | null;
  comments: number | null;
  reach: number | null;
  impressions: number | null;
  clicks: number | null;
  ctr: number | null;
  avg_position: number | null;
  users: number | null;
  sessions: number | null;
  note: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface UpsertPlatformMetricPayload {
  platform: SocialPlatform;
  period_type: MetricPeriodType;
  period_start: string;
  period_end: string;
  likes?: number | null;
  shares?: number | null;
  comments?: number | null;
  reach?: number | null;
  impressions?: number | null;
  clicks?: number | null;
  ctr?: number | null;
  avg_position?: number | null;
  users?: number | null;
  sessions?: number | null;
  note?: string | null;
}

export async function getPlatformMetric(
  platform: SocialPlatform,
  period_type: MetricPeriodType,
  period_start: string,
): Promise<PlatformMetric | null> {
  const { data, error } = await (supabase as any)
    .from(PLATFORM_METRICS_TABLE)
    .select("*")
    .eq("platform", platform)
    .eq("period_type", period_type)
    .eq("period_start", period_start)
    .limit(1);
  if (error) throw error;
  return (data?.[0] ?? null) as PlatformMetric | null;
}

export async function upsertPlatformMetric(payload: UpsertPlatformMetricPayload): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Not authenticated");
  const { error } = await (supabase as any)
    .from(PLATFORM_METRICS_TABLE)
    .upsert(
      {
        platform: payload.platform,
        period_type: payload.period_type,
        period_start: payload.period_start,
        period_end: payload.period_end,
        likes: payload.likes ?? null,
        shares: payload.shares ?? null,
        comments: payload.comments ?? null,
        reach: payload.reach ?? null,
        impressions: payload.impressions ?? null,
        clicks: payload.clicks ?? null,
        ctr: payload.ctr ?? null,
        avg_position: payload.avg_position ?? null,
        users: payload.users ?? null,
        sessions: payload.sessions ?? null,
        note: payload.note ?? null,
        created_by: uid,
      },
      { onConflict: "platform,period_type,period_start" },
    );
  if (error) throw error;
}

export async function listPlatformMetricsInRange(
  platform: SocialPlatform,
  from: string,
  to: string,
): Promise<PlatformMetric[]> {
  const { data, error } = await (supabase as any)
    .from(PLATFORM_METRICS_TABLE)
    .select("*")
    .eq("platform", platform)
    .gte("period_start", from)
    .lte("period_end", to)
    .order("period_start", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PlatformMetric[];
}

export async function listRecentPlatformMetrics(
  platform: SocialPlatform,
  limit = 20,
): Promise<PlatformMetric[]> {
  const { data, error } = await (supabase as any)
    .from(PLATFORM_METRICS_TABLE)
    .select("*")
    .eq("platform", platform)
    .order("period_start", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as PlatformMetric[];
}

export async function deletePlatformMetric(id: string): Promise<void> {
  const { error } = await (supabase as any).from(PLATFORM_METRICS_TABLE).delete().eq("id", id);
  if (error) throw error;
}
