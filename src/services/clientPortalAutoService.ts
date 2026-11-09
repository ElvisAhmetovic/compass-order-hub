import { supabase } from "@/integrations/supabase/client";

/** Fire-and-forget: make sure the client has a portal account (creates + emails login only if new). */
export function ensureClientPortal(input: { email?: string | null; name?: string | null; companyName?: string | null; orderId?: string | null }): void {
  if (!input.email) return;
  supabase.functions
    .invoke("ensure-client-portal", { body: input })
    .then(({ error }) => { if (error) console.error("ensure-client-portal failed:", error); })
    .catch((e) => console.error("ensure-client-portal failed:", e));
}
