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
