import { supabase } from "@/integrations/supabase/client";

export type PortalEvent =
  | "login" | "logout" | "pay_clicked" | "invoice_filter" | "document_downloaded"
  | "package_cancelled" | "ticket_created" | "language_changed" | "load_failed" | "page_view";

/** Saves one client action to the team-visible portal activity log. Fire-and-forget: never blocks or breaks the portal. */
export function logPortalActivity(event: PortalEvent, details: Record<string, string | number | boolean> = {}) {
  void (async () => {
    try {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      if (!u) return;
      await supabase.from("client_portal_activity").insert({ user_id: u.id, user_email: u.email ?? null, event, details });
    } catch { /* logging must never affect the client */ }
  })();
}
