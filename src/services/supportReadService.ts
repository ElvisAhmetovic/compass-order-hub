import { supabase } from "@/integrations/supabase/client";

export interface InquiryReadStatus {
  inquiryId: string;
  lastReadAt: string | null;
  unreadCount: number;
}

/**
 * Get the last read timestamp for a specific inquiry
 */
export async function getLastReadAt(inquiryId: string): Promise<string | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from("support_reply_reads")
    .select("last_read_at")
    .eq("user_id", userData.user.id)
    .eq("inquiry_id", inquiryId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching last read at:", error);
    return null;
  }

  return data?.last_read_at || null;
}

/**
 * Mark an inquiry as read (upsert last_read_at to now)
 */
export async function markInquiryAsRead(inquiryId: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;

  const { error } = await supabase
    .from("support_reply_reads")
    .upsert(
      {
        user_id: userData.user.id,
        inquiry_id: inquiryId,
        last_read_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,inquiry_id",
      }
    );

  if (error) {
    console.error("Error marking inquiry as read:", error);
  }
}

/**
 * Get unread reply count for a specific inquiry
 */
export async function getUnreadReplyCount(inquiryId: string): Promise<number> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return 0;

  // Get last read timestamp
  const lastReadAt = await getLastReadAt(inquiryId);

  // Count replies after last read (or all replies if never read)
  let query = supabase
    .from("support_replies")
    .select("id, created_at", { count: "exact", head: true })
    .eq("inquiry_id", inquiryId)
    .neq("user_id", userData.user.id); // Don't count own replies as unread

  if (lastReadAt) {
    query = query.gt("created_at", lastReadAt);
  }

  const { count, error } = await query;

  if (error) {
    console.error("Error fetching unread count:", error);
    return 0;
  }

  return count || 0;
}

/**
 * Get unread counts for multiple inquiries (batch operation)
 */
export async function getUnreadCountsForInquiries(
  inquiryIds: string[]
): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  if (inquiryIds.length === 0) return result;

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return result;

  // Get all read statuses for this user
  const { data: readStatuses, error: readError } = await supabase
    .from("support_reply_reads")
    .select("inquiry_id, last_read_at")
    .eq("user_id", userData.user.id)
    .in("inquiry_id", inquiryIds);

  if (readError) {
    console.error("Error fetching read statuses:", readError);
    return result;
  }

  const readMap = new Map(
    (readStatuses || []).map((s) => [s.inquiry_id, s.last_read_at])
  );

  // Get all replies for these inquiries
  const { data: replies, error: repliesError } = await supabase
    .from("support_replies")
    .select("id, inquiry_id, created_at, user_id")
    .in("inquiry_id", inquiryIds)
    .neq("user_id", userData.user.id); // Exclude own replies

  if (repliesError) {
    console.error("Error fetching replies:", repliesError);
    return result;
  }

  // Count unread replies per inquiry
  for (const inquiryId of inquiryIds) {
    const lastReadAt = readMap.get(inquiryId);
    const inquiryReplies = (replies || []).filter(
      (r) => r.inquiry_id === inquiryId
    );

    let unreadCount = 0;
    for (const reply of inquiryReplies) {
      if (!lastReadAt || new Date(reply.created_at) > new Date(lastReadAt)) {
        unreadCount++;
      }
    }

    result.set(inquiryId, unreadCount);
  }

  return result;
}
