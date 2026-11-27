import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const TOPICS = ["general", "orders", "invoices", "statuses", "clients", "outreach", "packages"];
type Fact = { id: string; topic: string; content: string; active: boolean; created_by_name: string | null; updated_at: string };
const label = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** Lists, edits and removes what the assistant has learned from the team. */
export default function AssistantKnowledgePanel() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [facts, setFacts] = useState<Fact[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [topic, setTopic] = useState("general");
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<{ id: string; content: string } | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("assistant_knowledge").select("id,topic,content,active,created_by_name,updated_at").order("updated_at", { ascending: false });
    if (error) { setError(error.message); return; }
    setError(null); setFacts(data ?? []);
  }, []);
  useEffect(() => { if (open) load(); }, [open, load]);

  const fail = (e: { message: string } | null) => { if (e) toast({ title: "Could not save", description: e.message, variant: "destructive" }); return !e; };
  const add = async () => {
    const content = draft.trim();
    if (content.length < 5) return;
    const { error } = await supabase.from("assistant_knowledge").insert({ topic, content, created_by: user?.id, created_by_name: user?.email ?? null });
    if (fail(error)) { setDraft(""); load(); }
  };
  const update = async (id: string, patch: Partial<Fact>) => {
    const { error } = await supabase.from("assistant_knowledge").update(patch).eq("id", id);
    if (fail(error)) { setEditing(null); load(); }
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this from the assistant's knowledge?")) return;
    const { error } = await supabase.from("assistant_knowledge").delete().eq("id", id);
    if (fail(error)) load();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild><Button variant="outline" size="sm"><Brain className="mr-2 h-4 w-4" />Assistant knowledge</Button></SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader><SheetTitle>What the assistant has learned</SheetTitle></SheetHeader>
        <p className="mt-1 text-xs text-muted-foreground">It saves what you explain in chat. Switch off or delete anything wrong.</p>
        <div className="mt-4 space-y-2 rounded-md border p-3">
          <Select value={topic} onValueChange={setTopic}>
            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
            <SelectContent>{TOPICS.map((t) => <SelectItem key={t} value={t}>{label(t)}</SelectItem>)}</SelectContent>
          </Select>
          <Textarea value={draft} maxLength={500} onChange={(e) => setDraft(e.target.value)} placeholder="Teach it something, e.g. 'Complaint orders get a call within 24 hours.'" />
          <Button size="sm" disabled={draft.trim().length < 5} onClick={add}>Add</Button>
        </div>
        {error && <p className="mt-3 text-sm text-destructive">Could not load: {error} <Button size="sm" variant="link" onClick={load}>Retry</Button></p>}
        {!error && !facts.length && <p className="mt-6 text-center text-sm text-muted-foreground">Nothing learned yet.</p>}
        {TOPICS.filter((t) => facts.some((f) => f.topic === t)).map((t) => (
          <div key={t} className="mt-5">
            <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{label(t)}</h3>
            <div className="space-y-2">{facts.filter((f) => f.topic === t).map((f) => (
              <div key={f.id} className={`rounded-md border p-3 text-sm ${f.active ? "" : "opacity-50"}`}>
                {editing?.id === f.id ? (
                  <div className="space-y-2">
                    <Textarea value={editing.content} maxLength={500} onChange={(e) => setEditing({ id: f.id, content: e.target.value })} />
                    <div className="flex gap-2"><Button size="sm" onClick={() => update(f.id, { content: editing.content.trim() })}>Save</Button><Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button></div>
                  </div>
                ) : <p className="whitespace-pre-wrap break-words">{f.content}</p>}
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="truncate">{f.created_by_name ?? "Team"} · {new Date(f.updated_at).toLocaleDateString("de-DE")}</span>
                  <Switch className="ml-auto" checked={f.active} onCheckedChange={(v) => update(f.id, { active: v })} aria-label="Use this" />
                  <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Edit" onClick={() => setEditing({ id: f.id, content: f.content })}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Delete" onClick={() => remove(f.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}</div>
          </div>
        ))}
      </SheetContent>
    </Sheet>
  );
}
