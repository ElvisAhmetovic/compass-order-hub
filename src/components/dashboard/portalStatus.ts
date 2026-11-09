import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PortalStatus = "active" | "invited" | "none";

/** active = has account and signed in at least once; invited = account but never signed in. */
export function portalStatusFrom(hasAccount: boolean, lastSignInAt: string | null): PortalStatus {
  if (!hasAccount) return "none";
  return lastSignInAt ? "active" : "invited";
}

export const PORTAL_LABEL: Record<PortalStatus, string> = {
  active: "Portal: active",
  invited: "Portal: invited",
  none: "No portal",
};

type Row = { email: string; has_account: boolean; last_sign_in_at: string | null };

/** Batched lookup of portal status for a list of emails (lower-cased keys). */
export function usePortalStatuses(emails: (string | null | undefined)[], refreshKey = 0) {
  const [map, setMap] = useState<Record<string, PortalStatus>>({});
  const key = [...new Set(emails.filter(Boolean).map((e) => (e as string).toLowerCase()))].sort().join(",");
  useEffect(() => {
    if (!key) return;
    let alive = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- RPC not yet in generated types
    (supabase.rpc as any)("portal_status_for_emails", { p_emails: key.split(",") }).then(
      ({ data }: { data: Row[] | null }) => {
        if (!alive || !data) return;
        const next: Record<string, PortalStatus> = {};
        data.forEach((r) => (next[r.email] = portalStatusFrom(r.has_account, r.last_sign_in_at)));
        setMap(next);
      },
    );
    return () => { alive = false; };
  }, [key, refreshKey]);
  return map;
}
