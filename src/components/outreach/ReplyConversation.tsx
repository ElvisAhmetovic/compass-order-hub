import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Entry = { key: string; at: string; who: string; out: boolean; subject: string | null; body: string | null; failed?: boolean };
const fmt = (d: string) => new Date(d).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });

/** Whole back-and-forth with one client: offer, their replies, our answers. Team answers via outreach-reply-send. */
export default function ReplyConversation({ replyId, draftId, email, subject, offer }: {
  replyId: string; draftId: string | null; email: string; subject: string | null;
  offer?: { subject: string; body: string; sent_at: string | null; approved_by_name: string | null } | null;
}) {
  const qc = useQueryClient();
  const key = ["outreach-thread", draftId ?? email];
  const { data: entries = [], isLoading, error, refetch } = useQuery({
    queryKey: key,
    queryFn: async (): Promise<Entry[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;
      const rq = sb.from("outreach_replies").select("id, from_email, from_name, subject, text_body, received_at, from_team_name, from_team_user");
      const mq = sb.from("outreach_messages").select("id, subject, body, sent_by_name, status, created_at");
      const [r, m] = await Promise.all([
        draftId ? rq.eq("draft_id", draftId) : rq.is("draft_id", null).ilike("from_email", email),
        draftId ? mq.eq("draft_id", draftId) : mq.is("draft_id", null).ilike("to_email", email),
      ]);
      if (r.error) throw r.error;
      if (m.error) throw m.error;
      const list: Entry[] = [
        ...r.data.map((x: { id: string; from_email: string; from_name: string | null; subject: string | null; text_body: string | null; received_at: string; from_team_name: string | null; from_team_user: string | null }) =>
          x.from_team_user
            ? ({ key: `r${x.id}`, at: x.received_at, who: `${x.from_team_name || x.from_email} (from own mailbox)`, out: true, subject: x.subject, body: x.text_body })
            : ({ key: `r${x.id}`, at: x.received_at, who: `Client: ${x.from_name || x.from_email}`, out: false, subject: x.subject, body: x.text_body })),
        ...m.data.map((x: { id: string; subject: string; body: string; sent_by_name: string | null; status: string; created_at: string }) =>
          ({ key: `m${x.id}`, at: x.created_at, who: x.sent_by_name || "Team", out: true, subject: x.subject, body: x.body, failed: x.status !== "sent" })),
      ];
      if (offer?.sent_at) list.push({ key: "offer", at: offer.sent_at, who: `${offer.approved_by_name || "Team"} (offer)`, out: true, subject: offer.subject, body: offer.body });
      return list.sort((a, b) => a.at.localeCompare(b.at));
    },
  });

  const [subj, setSubj] = useState(subject && /^re:/i.test(subject.trim()) ? subject.trim() : `Re: ${subject ?? ""}`.trim());
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const send = async () => {
    if (!body.trim() || !subj.trim()) return toast({ title: "Write a subject and a message first", variant: "destructive" });
    setSending(true);
    const { error: err } = await supabase.functions.invoke("outreach-reply-send", { body: { reply_id: replyId, subject: subj, body } });
    setSending(false);
    if (err) {
      let msg = err.message;
      if (err instanceof FunctionsHttpError) { try { const j = await err.context.json(); msg = typeof j.error === "string" ? j.error : JSON.stringify(j.error); } catch { /* keep */ } }
      return toast({ title: "Not sent", description: msg, variant: "destructive" });
    }
    toast({ title: "Reply sent", description: email });
    setBody("");
    qc.invalidateQueries({ queryKey: key });
  };

  return (
    <div className="border-t pt-3 space-y-3">
      <p className="text-sm font-medium">Conversation</p>
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" />
        : error ? <p className="text-sm text-destructive">Could not load the conversation. <button className="underline" onClick={() => refetch()}>Try again</button></p>
        : <div className="space-y-2">{entries.map((e) => (
            <div key={e.key} className={`rounded-md p-3 text-sm min-w-0 ${e.out ? "bg-primary/5 ml-8" : "bg-muted mr-8"}`}>
              <p className="text-xs text-muted-foreground">{e.who} · {fmt(e.at)}{e.failed ? " · not delivered" : ""}</p>
              {e.subject && <p className="font-medium">{e.subject}</p>}
              <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{e.body || "(no plain-text content)"}</p>
            </div>))}</div>}
      <div className="space-y-2">
        <p className="text-sm font-medium">Write a reply</p>
        <Input aria-label="Reply subject" value={subj} onChange={(e) => setSubj(e.target.value)} maxLength={200} />
        <Textarea aria-label="Reply message" value={body} onChange={(e) => setBody(e.target.value)} rows={5} maxLength={10000} placeholder="Your answer to the client…" />
        <Button size="sm" onClick={send} disabled={sending}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}Send
        </Button>
      </div>
    </div>
  );
}
