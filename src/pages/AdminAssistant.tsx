import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import Sidebar from "@/components/dashboard/Sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, ChevronRight, Loader2, Plus, Send, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ConfirmActionCard } from "@/components/assistant/ConfirmActionCard";
import { assistantPath, toChatMessage, type ChatMessage } from "@/components/assistant/assistantView";

type Thread = { id: string; title: string; updated_at: string };

export default function AdminAssistant() {
  const { user } = useAuth();
  const { threadId } = useParams();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const isAdmin = user?.role === "admin";

  const loadThreads = useCallback(async () => {
    const { data, error } = await supabase.from("assistant_threads").select("id,title,updated_at").order("updated_at", { ascending: false });
    if (error) { setLoadError(error.message); return; }
    setThreads(data ?? []);
  }, []);

  const newThread = useCallback(async () => {
    if (!user?.id) return;
    const { data, error } = await supabase.from("assistant_threads").insert({ user_id: user.id }).select("id,title,updated_at").single();
    if (error) { toast({ title: "Could not start chat", description: error.message, variant: "destructive" }); return; }
    setThreads((t) => [data, ...t]);
    navigate(assistantPath(data.id));
  }, [navigate, user?.id]);

  useEffect(() => { if (isAdmin) loadThreads(); }, [isAdmin, loadThreads]);

  useEffect(() => {
    if (!threadId || !isAdmin) { setMessages([]); return; }
    supabase.from("assistant_messages").select("id,role,content,parts").eq("thread_id", threadId).order("created_at")
      .then(({ data, error }) => { if (error) setLoadError(error.message); else { setLoadError(null); setMessages((data ?? []).map(toChatMessage)); } });
    inputRef.current?.focus();
  }, [threadId, isAdmin]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, sending]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending || !threadId) return;
    setInput("");
    setMessages((m) => [...m, { id: `tmp-${Date.now()}`, role: "user", content: text, parts: {} }]);
    setSending(true);
    const { data, error } = await supabase.functions.invoke("admin-assistant", { body: { threadId, message: text } });
    setSending(false);
    if (error) {
      setInput(text);
      toast({ title: "Assistant failed", description: "Your message was kept. Please try again.", variant: "destructive" });
    } else {
      const d = data as { text: string; parts: ChatMessage["parts"] };
      setMessages((m) => [...m, { id: `a-${Date.now()}`, role: "assistant", content: d.text, parts: d.parts }]);
      loadThreads();
    }
    inputRef.current?.focus();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("assistant_threads").delete().eq("id", id);
    if (error) { toast({ title: "Could not delete chat", description: error.message, variant: "destructive" }); return; }
    setThreads((t) => t.filter((x) => x.id !== id));
    if (id === threadId) navigate(assistantPath());
  };

  if (user && !isAdmin) {
    return (<div className="flex min-h-screen"><Sidebar /><div className="flex-1 flex flex-col items-center justify-center p-8 text-muted-foreground">The assistant is only available to admins.</div></div>);
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex min-w-0 h-screen">
        <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-muted/30">
          <div className="p-3"><Button className="w-full" onClick={newThread}><Plus className="mr-2 h-4 w-4" />New chat</Button></div>
          <nav className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
            {threads.map((t) => (
              <div key={t.id} className={`group flex items-center rounded-md text-sm ${t.id === threadId ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}>
                <button className="flex-1 truncate px-3 py-2 text-left" onClick={() => navigate(assistantPath(t.id))}>{t.title}</button>
                <button aria-label="Delete chat" className="px-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => remove(t.id)}><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
            {!threads.length && <p className="px-3 py-2 text-xs text-muted-foreground">No chats yet.</p>}
          </nav>
        </aside>
        <main className="flex-1 flex flex-col min-w-0">
          <header className="flex items-center gap-3 border-b border-border px-5 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground"><Bot className="h-5 w-5" /></div>
            <div><h1 className="font-semibold leading-tight">Empria Assistant</h1><p className="text-xs text-muted-foreground">Asks before changing anything</p></div>
            <Button size="sm" variant="outline" className="ml-auto md:hidden" onClick={newThread}><Plus className="h-4 w-4" /></Button>
          </header>
          <div className="flex-1 overflow-y-auto px-5 py-6">
            <div className="mx-auto max-w-3xl space-y-5">
              {loadError && <div className="rounded-md border border-destructive p-3 text-sm text-destructive">Could not load: {loadError} <Button size="sm" variant="link" onClick={() => { setLoadError(null); loadThreads(); }}>Retry</Button></div>}
              {!threadId && (
                <div className="py-16 text-center">
                  <p className="text-muted-foreground mb-4">Ask about orders, invoices, packages, tickets, or tell me what to create.</p>
                  <Button onClick={newThread}><Plus className="mr-2 h-4 w-4" />Start a chat</Button>
                </div>
              )}
              {messages.map((m) => m.role === "user" ? (
                <div key={m.id} className="flex justify-end"><div className="max-w-[80%] whitespace-pre-wrap rounded-2xl bg-primary px-4 py-2 text-primary-foreground">{m.content}</div></div>
              ) : (
                <div key={m.id} className="space-y-2">
                  {!!m.parts.trace?.length && (
                    <details className="rounded-md border border-border text-xs">
                      <summary className="flex cursor-pointer items-center gap-1 px-3 py-2 text-muted-foreground"><ChevronRight className="h-3 w-3" />Looked up {m.parts.trace.length} thing{m.parts.trace.length > 1 ? "s" : ""}</summary>
                      <div className="space-y-2 px-3 pb-3">{m.parts.trace.map((t, i) => (
                        <div key={i}><span className="font-mono font-semibold">{t.tool}</span> <span className="font-mono text-muted-foreground">{JSON.stringify(t.args)}</span><pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-muted p-2">{t.result}</pre></div>
                      ))}</div>
                    </details>
                  )}
                  <div className="prose prose-sm max-w-none text-foreground [&_table]:text-xs [&_td]:border [&_td]:border-border [&_td]:px-2 [&_th]:border [&_th]:border-border [&_th]:px-2"><ReactMarkdown>{m.content}</ReactMarkdown></div>
                  {m.parts.actions?.map((a) => <ConfirmActionCard key={a} actionId={a} />)}
                </div>
              ))}
              {sending && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Thinking…</div>}
              <div ref={endRef} />
            </div>
          </div>
          {threadId && (
            <div className="border-t border-border p-4">
              <div className="mx-auto flex max-w-3xl items-end gap-2">
                <Textarea ref={inputRef} autoFocus value={input} rows={2} placeholder="e.g. How many orders this month?" className="resize-none"
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
                <Button size="icon" className="h-10 w-10 shrink-0" disabled={sending || !input.trim()} onClick={send} aria-label="Send"><Send className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
