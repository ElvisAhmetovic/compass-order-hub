import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, MailOpen } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useClientsByEmail } from "@/hooks/useClientsByEmail";
import { matchClientByEmail } from "@/lib/clientMatch";
import { CreateClientDialog } from "@/components/clients/CreateClientDialog";

export type OutreachReply = {
  id: string; draft_id: string | null; from_email: string; from_name: string | null; subject: string | null;
  text_body: string | null; received_at: string; read_at: string | null; company_name?: string | null; ticket_skip_reason?: string | null;
  followup_status?: string | null; followup_sent_at?: string | null;
};
type DraftInfo = { id: string; approved_by_name: string | null; company_name: string | null };

const SKIP: Record<string, string> = { disabled: "automatic follow-up is off", not_linked: "not linked to an offer", already_sent: "already sent for this offer",
  opted_out: "client opted out", system_sender: "system or no-reply sender", own_address: "our own address", auto_reply: "automatic reply / out of office", no_reply_domain: "reply address not set up" };
const followUpLabel = (r: { followup_status?: string | null; followup_sent_at?: string | null }) =>
  r.followup_status === "sent" ? `Follow-up sent ${r.followup_sent_at ? fmt(r.followup_sent_at) : ""}`
  : r.followup_status === "failed" ? "Follow-up could not be sent"
  : `No follow-up: ${SKIP[(r.followup_status ?? "").replace("skipped:", "")] ?? r.followup_status}`;
const fmt = (d: string) => new Date(d).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });

export default function OutreachReplies({ replies, drafts, q, onChanged }: {
  replies: OutreachReply[]; drafts: DraftInfo[]; q: string; onChanged: () => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [creating, setCreating] = useState<{ name?: string | null; contact_person?: string | null; email?: string | null } | null>(null);
  const qc = useQueryClient();
  const { data: known = [] } = useClientsByEmail(replies.map((r) => r.from_email));
  const byId = new Map(drafts.map((d) => [d.id, d]));
  const companyOf = (r: OutreachReply) => matchClientByEmail(known, r.from_email)?.name || r.company_name || (r.draft_id ? byId.get(r.draft_id)?.company_name : null) || null;
  const list = replies.filter((r) => !q || `${companyOf(r) ?? ""} ${r.from_email} ${r.from_name ?? ""} ${r.subject ?? ""}`.toLowerCase().includes(q.toLowerCase()));

  const markRead = async (r: OutreachReply, read: boolean) => {
    const { data: auth } = await supabase.auth.getUser();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("outreach_replies")
      .update({ read_at: read ? new Date().toISOString() : null, read_by: read ? auth.user?.id ?? null : null }).eq("id", r.id);
    if (error) toast({ title: "Could not update", description: error.message, variant: "destructive" });
    onChanged();
  };

  useEffect(() => {
    const r = replies.find((x) => x.id === open);
    if (r && !r.read_at) markRead(r, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (list.length === 0) return <p className="text-muted-foreground">No replies yet. Client replies to sent offers show up here.</p>;
  return (
    <div className="grid gap-2">
      {list.map((r) => {
        const d = r.draft_id ? byId.get(r.draft_id) : undefined;
        const isOpen = open === r.id;
        return (
          <Card key={r.id} className={r.read_at ? "" : "border-primary"}>
            <CardContent className="pt-4 space-y-2">
              <button type="button" className="w-full text-left" onClick={() => setOpen(isOpen ? null : r.id)}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {r.read_at ? <MailOpen className="h-4 w-4 text-muted-foreground" /> : <Mail className="h-4 w-4 text-primary" />}
                    <div>
                      <p className="font-semibold">{companyOf(r) ?? <span className="text-muted-foreground font-normal">Unknown business</span>}</p>
                      <p className={`text-sm ${r.read_at ? "text-muted-foreground" : ""}`}>{r.from_name ? `${r.from_name} · ` : ""}{r.from_email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{fmt(r.received_at)}</span>
                </div>
                <p className="text-sm mt-1">{r.subject || "(no subject)"}</p>
                {(() => { const c = matchClientByEmail(known, r.from_email); return c
                  ? <p className="text-xs text-muted-foreground mt-1">{c.contact_person ? `${c.contact_person} · ` : ""}{c.phone || "no phone"} · <Link className="underline text-primary" to={`/clients/${c.id}`} onClick={(e) => e.stopPropagation()}>View client</Link></p>
                  : <p className="text-xs text-muted-foreground mt-1">Not a known client · <span role="link" tabIndex={0} className="underline text-primary cursor-pointer" onClick={(e) => { e.stopPropagation(); setCreating({ name: r.company_name || r.from_name, contact_person: r.from_name, email: r.from_email }); }}>Create client</span></p>; })()}
                <div className="mt-1">
                  {d ? <Badge variant="secondary">Offer sent by {d.approved_by_name || "unknown"}</Badge>
                    : <Badge variant="outline">Not linked to an offer</Badge>}
                  {r.ticket_skip_reason === "newsletter" && <Badge variant="outline" className="ml-1">Newsletter / not a reply</Badge>}
                  {r.followup_status && <p className="text-xs text-muted-foreground mt-1">{followUpLabel(r)}</p>}
                </div>
              </button>
              {isOpen && (
                <>
                  <p className="text-sm whitespace-pre-wrap break-words [overflow-wrap:anywhere] border-t pt-2">{r.text_body || "(This email has no plain-text content.)"}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" asChild><a href={`mailto:${r.from_email}?subject=${encodeURIComponent(`Re: ${r.subject ?? ""}`)}`}>Reply by email</a></Button>
                    <Button size="sm" variant="ghost" onClick={() => markRead(r, false)}>Mark unread</Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
      <CreateClientDialog open={!!creating} onOpenChange={(o) => !o && setCreating(null)} prefill={creating ?? undefined}
        onClientCreated={() => { setCreating(null); qc.invalidateQueries({ queryKey: ["clients-by-email"] }); }} />
    </div>
  );
}
