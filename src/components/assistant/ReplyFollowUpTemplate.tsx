import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MailCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { renderReplyFollowUp, type ReplyTemplate } from "../../../supabase/functions/_shared/outreachRules";

const sample = { client_name: "Anna Müller", company_name: "Zahnarztpraxis Müller", sender_name: "Johann Nowak" };

/** Admin editor for the fixed, team-written follow-up sent automatically to outreach replies. */
export default function ReplyFollowUpTemplate() {
  const [open, setOpen] = useState(false);
  const [t, setT] = useState<ReplyTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [lang, setLang] = useState<"en" | "de">("de");

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("outreach_reply_template").select("enabled, subject_en, body_en, subject_de, body_de").eq("id", 1).maybeSingle()
      .then(({ data, error }: { data: ReplyTemplate | null; error: { message: string } | null }) => {
        if (error) toast({ title: "Could not load template", description: error.message, variant: "destructive" });
        else setT(data);
      });
  }, [open]);

  const save = async () => {
    if (!t) return;
    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).from("outreach_reply_template").update({ ...t, updated_by: auth.user?.id ?? null }).eq("id", 1).select("id");
    setSaving(false);
    if (error || !data?.length) toast({ title: "Could not save", description: error?.message ?? "Only admins can change this.", variant: "destructive" });
    else { toast({ title: "Follow-up template saved", description: t.enabled ? "It is now sent automatically to new replies." : "Automatic sending is off." }); setOpen(false); }
  };

  const set = (k: keyof ReplyTemplate) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => t && setT({ ...t, [k]: e.target.value });
  const preview = t ? renderReplyFollowUp(t, lang, sample) : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline"><MailCheck className="mr-2 h-4 w-4" />Reply follow-up</Button></DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reply follow-up</DialogTitle>
          <DialogDescription>Sent automatically once per offer when a client replies to an AI outreach email. Placeholders: {"{client_name}"}, {"{company_name}"}, {"{sender_name}"}.</DialogDescription>
        </DialogHeader>
        {!t ? <p className="text-sm text-muted-foreground">Loading…</p> : (
          <div className="space-y-4">
            <div className="flex items-center gap-3"><Switch id="fu-enabled" checked={t.enabled} onCheckedChange={(v) => setT({ ...t, enabled: v })} /><Label htmlFor="fu-enabled">Send automatically</Label></div>
            <div className="grid gap-2"><Label htmlFor="fu-sde">German subject</Label><Input id="fu-sde" value={t.subject_de} onChange={set("subject_de")} maxLength={200} /></div>
            <div className="grid gap-2"><Label htmlFor="fu-bde">German message</Label><Textarea id="fu-bde" rows={6} value={t.body_de} onChange={set("body_de")} maxLength={5000} /></div>
            <div className="grid gap-2"><Label htmlFor="fu-sen">English subject</Label><Input id="fu-sen" value={t.subject_en} onChange={set("subject_en")} maxLength={200} /></div>
            <div className="grid gap-2"><Label htmlFor="fu-ben">English message</Label><Textarea id="fu-ben" rows={6} value={t.body_en} onChange={set("body_en")} maxLength={5000} /></div>
            <div className="rounded-md border border-border p-3 bg-muted/30">
              <div className="flex items-center justify-between mb-2"><p className="text-xs font-medium text-muted-foreground">Preview</p>
                <div className="flex gap-1">{(["de", "en"] as const).map((l) => <Button key={l} size="sm" variant={lang === l ? "secondary" : "ghost"} onClick={() => setLang(l)}>{l.toUpperCase()}</Button>)}</div></div>
              <p className="font-medium text-sm">{preview?.subject}</p>
              <p className="text-sm whitespace-pre-line mt-1">{preview?.text}</p>
            </div>
            <div className="flex justify-end"><Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button></div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
