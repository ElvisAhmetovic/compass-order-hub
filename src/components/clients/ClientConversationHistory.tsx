import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowDownLeft, ArrowUpRight, Loader2 } from "lucide-react";
import { buildClientTimeline, filterTimeline, type TimelineFilter, type TimelineKind } from "@/lib/clientTimeline";
import ReplyConversation from "@/components/outreach/ReplyConversation";

const fmt = (d: string) => new Date(d).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
const LABEL: Record<TimelineKind, string> = { outreach_offer: "Outreach offer", outreach_reply: "Client reply", team_reply: "Team answer", order_email: "Order / invoice email", status_email: "Status update" };
const FILTERS: [TimelineFilter, string][] = [["all", "All"], ["sent", "Sent"], ["received", "Received"], ["outreach", "Outreach"], ["orders", "Orders & invoices"]];

export default function ClientConversationHistory({ email }: { email: string }) {
  const [filter, setFilter] = useState<TimelineFilter>("all");
  const [open, setOpen] = useState<string | null>(null);
  const [replying, setReplying] = useState(false);
  const q = useQuery({
    queryKey: ["client-timeline", email.toLowerCase()],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;
      const [o, r, m, e, n] = await Promise.all([
        sb.from("outreach_drafts").select("id, sent_at, subject, body, approved_by_name").ilike("email", email).eq("status", "sent").limit(200),
        sb.from("outreach_replies").select("id, draft_id, received_at, subject, text_body, from_name, from_email, from_team_name, from_team_user").ilike("from_email", email).order("received_at", { ascending: false }).limit(200),
        sb.from("outreach_messages").select("id, created_at, subject, body, sent_by_name, status").ilike("to_email", email).limit(200),
        sb.from("client_email_logs").select("id, created_at, email_subject, template_name, custom_message, sent_by_name, invoice_number").ilike("sent_to", `%${email}%`).limit(200),
        sb.from("notification_logs").select("id, created_at, sent_at, email_subject, new_status, changed_by_name, email_sent").contains("recipient_emails", [email]).limit(200),
      ]);
      for (const x of [o, r, m, e, n]) if (x.error) throw x.error;
      const clientReplies = (r.data ?? []).filter((x: { from_team_user: string | null }) => !x.from_team_user);
      return { list: buildClientTimeline({ offers: o.data, replies: r.data, messages: m.data, orderEmails: e.data, statusEmails: n.data }),
        latestReply: (clientReplies[0] ?? null) as { id: string; draft_id: string | null; subject: string | null } | null };
    },
  });
  const list = q.data ? filterTimeline(q.data.list, filter) : [];

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-base">Conversation history ({q.data?.list.length ?? "…"})</CardTitle>
        {q.data?.latestReply && <Button size="sm" variant="outline" onClick={() => setReplying((v) => !v)}>{replying ? "Close reply" : "Write a reply"}</Button>}
      </CardHeader>
      <CardContent className="space-y-3 min-w-0">
        {replying && q.data?.latestReply && <ReplyConversation replyId={q.data.latestReply.id} draftId={q.data.latestReply.draft_id} email={email} subject={q.data.latestReply.subject} />}
        <div className="flex flex-wrap gap-2">{FILTERS.map(([k, l]) => (
          <Button key={k} size="sm" variant={filter === k ? "default" : "outline"} onClick={() => setFilter(k)}>{l}</Button>))}</div>
        {q.isLoading ? <Loader2 className="h-4 w-4 animate-spin" />
          : q.error ? <div className="flex items-center gap-3 text-sm"><span>Could not load the conversation history.</span><Button size="sm" onClick={() => q.refetch()}>Retry</Button></div>
          : list.length === 0 ? <p className="text-sm text-muted-foreground">No emails here yet.</p>
          : <div className="space-y-2">{list.map((e) => (
              <button key={e.key} type="button" onClick={() => setOpen(open === e.key ? null : e.key)}
                className={`block w-full text-left rounded-md p-3 text-sm min-w-0 ${e.direction === "received" ? "bg-muted" : "bg-primary/5"}`}>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {e.direction === "received" ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                  <span>{e.direction === "received" ? "Received" : "Sent"} · {fmt(e.at)}{e.who ? ` · ${e.who}` : ""}</span>
                  <Badge variant="outline">{LABEL[e.kind]}</Badge>
                </div>
                <p className="font-medium mt-1 break-words [overflow-wrap:anywhere]">{e.subject}</p>
                {open === e.key && <p className="mt-2 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{e.body || "Only the subject was saved for this email."}</p>}
              </button>))}</div>}
      </CardContent>
    </Card>
  );
}
