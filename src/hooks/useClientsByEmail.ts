import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { normEmail, type ClientLite } from "@/lib/clientMatch";

/** Loads clients matching any of the given emails in one query. */
export function useClientsByEmail(emails: (string | null | undefined)[]) {
  const list = Array.from(new Set(emails.map(normEmail).filter(Boolean))).sort();
  return useQuery({
    queryKey: ["clients-by-email", list],
    enabled: list.length > 0,
    queryFn: async (): Promise<ClientLite[]> => {
      const out: ClientLite[] = [];
      for (let i = 0; i < list.length; i += 100) {
        const { data, error } = await supabase.from("clients").select("id, name, contact_person, email, phone")
          .or(list.slice(i, i + 100).map((e) => `email.ilike.${e.replace(/[,()]/g, "")}`).join(","));
        if (error) throw error;
        out.push(...(data ?? []));
      }
      return out;
    },
  });
}
