import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Pencil, Trash2, Sparkles, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const TOPICS = ["general", "orders", "invoices", "statuses", "clients", "outreach", "packages", "client_replies"];
const KINDS = [
  { id: "fact", label: "Facts", hint: "e.g. 'Complaint orders get a call within 24 hours.'" },
  { id: "process", label: "Processes", hint: "When … happens: 1) … 2) … 3) …" },
  { id: "rule", label: "Rules", hint: "Always / never … because …" },
];
const SOURCE_LABEL: Record<string, string> = { chat: "Taught in chat", manual: "Added manually", site_walkthrough: "Site walkthrough", client_replies: "From client replies" };
const IN_USE_LIMIT = 150;
type Fact = { id: string; topic: string; content: string; active: boolean; created_by_name: string | null; updated_at: string; source: string; kind: string };
const label = (t: string) => (t === "client_replies" ? "Client replies" : t.charAt(0).toUpperCase() + t.slice(1));

/** Lists, edits and removes what the assistant knows: site walkthrough, team-taught facts, processes, rules and client-reply patterns. */
export default function AssistantKnowledgePanel() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [facts, setFacts] = useState<Fact[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState("fact");
  const [filterTopic, setFilterTopic] = useState("all");
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState("general");
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<{ id: string; content: string } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [learning, setLearning] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("assistant_knowledge").select("id,topic,content,active,created_by_name,updated_at,source,kind").order("updated_at", { ascending: false });
    if (error) { setError(error.message); return; }
    setError(null); setFacts((data ?? []) as Fact[]); setSelected(new Set());
  }, []);
  useEffect(() => { if (open) load(); }, [open, load]);

  const ofKind = facts.filter((f) => (f.kind ?? "fact") === kind);
  const counts = useMemo(() => Object.fromEntries(TOPICS.map((t) => [t, ofKind.filter((f) => f.topic === t).length])), [ofKind]);
  const q = search.trim().toLowerCase();
  const shown = ofKind.filter((f) => (filterTopic === "all" || f.topic === filterTopic) && (!q || f.content.toLowerCase().includes(q)));
  const inUse = facts.filter((f) => f.active).length;

  const fail = (e: { message: string } | null) => { if (e) toast({ title: "Could not save", description: e.message, variant: "destructive" }); return !e; };
  const add = async () => {
    const content = draft.trim();
    if (content.length < 5) return;
    const { error } = await supabase.from("assistant_knowledge").insert({ topic, content, kind, source: "manual", created_by: user?.id, created_by_name: user?.email ?? null });
    if (fail(error)) { setDraft(""); load(); }
  };
  const update = async (id: string, patch: Partial<Fact>) => {
    const { error } = await supabase.from("assistant_knowledge").update(patch).eq("id", id);
    if (fail(error)) { setEditing(null); load(); }
  };
  const remove = async (ids: string[]) => {
    if (!ids.length || !confirm(`Delete ${ids.length} item(s) from the assistant's knowledge?`)) return;
    const { error } = await supabase.from("assistant_knowledge").delete().in("id", ids);
    if (fail(error)) load();
  };
  const switchOff = async (ids: string[]) => {
    const { error } = await supabase.from("assistant_knowledge").update({ active: false }).in("id", ids);
    if (fail(error)) load();
  };
  const learnFromReplies = async () => {
    setLearning(true);
    const { data, error } = await supabase.functions.invoke("assistant-learn-replies");
    setLearning(false);
    if (error) { toast({ title: "Could not learn from replies", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Learned from client replies", description: data?.message ?? `${data?.saved ?? 0} patterns saved (replaced the previous ones).` });
    load();
  };
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const hint = KINDS.find((k) => k.id === kind)!.hint;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild><Button variant="outline" size="sm"><Brain className="mr-2 h-4 w-4" />Assistant knowledge</Button></SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader><SheetTitle>What the assistant knows</SheetTitle></SheetHeader>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{inUse} of {facts.length} in use</span>
          {inUse > IN_USE_LIMIT - 10 && <span className="text-destructive">· only the first {IN_USE_LIMIT} are read; switch off ones you don't need</span>}
          <Button size="sm" variant="outline" className="ml-auto h-7" disabled={learning} onClick={learnFromReplies}>
            {learning ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1 h-3.5 w-3.5" />}Learn from replies
          </Button>
        </div>

        <div className="mt-3 flex gap-1 rounded-md bg-muted p-1">
          {KINDS.map((k) => (
            <Button key={k.id} size="sm" variant={kind === k.id ? "default" : "ghost"} className="h-7 flex-1" onClick={() => { setKind(k.id); setSelected(new Set()); }}>
              {k.label} ({facts.filter((f) => (f.kind ?? "fact") === k.id).length})
            </Button>
          ))}
        </div>

        <div className="mt-3 space-y-2 rounded-md border p-3">
          <Select value={topic} onValueChange={setTopic}>
            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
            <SelectContent>{TOPICS.map((t) => <SelectItem key={t} value={t}>{label(t)}</SelectItem>)}</SelectContent>
          </Select>
          <Textarea value={draft} maxLength={500} onChange={(e) => setDraft(e.target.value)} placeholder={hint} />
          <Button size="sm" disabled={draft.trim().length < 5} onClick={add}>Add</Button>
        </div>

        <div className="mt-3 flex gap-2">
          <Input className="h-8" placeholder="Search knowledge…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={filterTopic} onValueChange={setFilterTopic}>
            <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All topics ({ofKind.length})</SelectItem>
              {TOPICS.map((t) => <SelectItem key={t} value={t}>{label(t)} ({counts[t]})</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {shown.length > 0 && (
          <div className="mt-2 flex items-center gap-2 text-xs">
            <Checkbox checked={selected.size > 0 && selected.size === shown.length} onCheckedChange={(v) => setSelected(v ? new Set(shown.map((f) => f.id)) : new Set())} aria-label="Select all shown" />
            <span className="text-muted-foreground">{selected.size ? `${selected.size} selected` : "Select all"}</span>
            {selected.size > 0 && <>
              <Button size="sm" variant="outline" className="ml-auto h-7" onClick={() => switchOff([...selected])}>Switch off</Button>
              <Button size="sm" variant="destructive" className="h-7" onClick={() => remove([...selected])}>Delete</Button>
            </>}
          </div>
        )}

        {error && <p className="mt-3 text-sm text-destructive">Could not load: {error} <Button size="sm" variant="link" onClick={load}>Retry</Button></p>}
        {!error && !shown.length && <p className="mt-6 text-center text-sm text-muted-foreground">Nothing here yet.</p>}
        {TOPICS.filter((t) => shown.some((f) => f.topic === t)).map((t) => (
          <div key={t} className="mt-5">
            <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{label(t)}</h3>
            <div className="space-y-2">{shown.filter((f) => f.topic === t).map((f) => (
              <div key={f.id} className={`rounded-md border p-3 text-sm ${f.active ? "" : "opacity-50"}`}>
                <div className="flex gap-2">
                  <Checkbox checked={selected.has(f.id)} onCheckedChange={() => toggle(f.id)} aria-label="Select" className="mt-0.5" />
                  <div className="min-w-0 flex-1">
                    {editing?.id === f.id ? (
                      <div className="space-y-2">
                        <Textarea value={editing.content} maxLength={500} onChange={(e) => setEditing({ id: f.id, content: e.target.value })} />
                        <div className="flex gap-2"><Button size="sm" onClick={() => update(f.id, { content: editing.content.trim() })}>Save</Button><Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button></div>
                      </div>
                    ) : <p className="whitespace-pre-wrap break-words">{f.content}</p>}
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="shrink-0 text-[10px]">{SOURCE_LABEL[f.source] ?? f.source}</Badge>
                  <span className="truncate">{f.created_by_name ?? "Team"} · {new Date(f.updated_at).toLocaleDateString("de-DE")}</span>
                  <Switch className="ml-auto" checked={f.active} onCheckedChange={(v) => update(f.id, { active: v })} aria-label="Use this" />
                  <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Edit" onClick={() => setEditing({ id: f.id, content: f.content })}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Delete" onClick={() => remove([f.id])}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}</div>
          </div>
        ))}
      </SheetContent>
    </Sheet>
  );
}
