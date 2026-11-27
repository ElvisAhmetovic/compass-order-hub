import { useCallback, useEffect, useRef, useState } from "react";
import { AssistantMarkdown } from "./AssistantMarkdown";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Brain, ChevronRight, Loader2, Plus, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ConfirmActionCard } from "./ConfirmActionCard";
import { toChatMessage, type ChatMessage } from "./assistantView";

/** Readable server error message from a failed function call. */
async function errorText(error: unknown): Promise<string> {
  if (!error) return "";
  if (error instanceof FunctionsHttpError) {
    try { const b = await error.context.clone().json(); return typeof b?.error === "string" ? b.error : ""; } catch { return ""; }
  }
  return error instanceof Error ? error.message : "";
}

export type Thread = { id: string; title: string; updated_at: string };

/** Saved conversations of the signed-in admin. */
export function useAssistantThreads(enabled: boolean) {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    const { data, error } = await supabase.from("assistant_threads").select("id,title,updated_at").order("updated_at", { ascending: false });
    if (error) { setError(error.message); return; }
    setError(null);
    setThreads(data ?? []);
    setLoaded(true);
  }, []);
  const create = useCallback(async (): Promise<string | null> => {
    if (!user?.id) return null;
    const { data, error } = await supabase.from("assistant_threads").insert({ user_id: user.id }).select("id,title,updated_at").single();
    if (error) { toast({ title: "Could not start chat", description: error.message, variant: "destructive" }); return null; }
    setThreads((t) => [data, ...t]);
    return data.id;
  }, [user?.id]);
  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from("assistant_threads").delete().eq("id", id);
    if (error) { toast({ title: "Could not delete chat", description: error.message, variant: "destructive" }); return false; }
    setThreads((t) => t.filter((x) => x.id !== id));
    return true;
  }, []);
  useEffect(() => { if (enabled) reload(); }, [enabled, reload]);
  return { threads, loaded, error, reload, create, remove };
}

type Props = { threadId: string | null; onNewChat: () => Promise<string | null>; onReplied?: () => void; compact?: boolean };

export function AssistantChat({ threadId, onNewChat, onReplied, compact }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!threadId) { setMessages([]); return; }
    supabase.from("assistant_messages").select("id,role,content,parts").eq("thread_id", threadId).order("created_at")
      .then(({ data, error }) => { if (error) setLoadError(error.message); else { setLoadError(null); setMessages((data ?? []).map(toChatMessage)); } });
    inputRef.current?.focus();
  }, [threadId, reloadKey]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, sending]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending || !threadId) return;
    setInput("");
    setMessages((m) => [...m, { id: `tmp-${Date.now()}`, role: "user", content: text, parts: {} }]);
    setSending(true);
    const ask = (id: string) => supabase.functions.invoke("admin-assistant", { body: { threadId: id, message: text } });
    let { data, error } = await ask(threadId);
    let detail = await errorText(error);
    if (detail === "Thread not found") {
      const fresh = await onNewChat();
      if (fresh) ({ data, error } = await ask(fresh));
      detail = await errorText(error);
    }
    setSending(false);
    if (error) {
      setInput(text);
      toast({ title: "Assistant failed", description: `${detail || "Something went wrong"}. Your message was kept, please try again.`, variant: "destructive" });
    } else {
      const d = data as { text: string; parts: ChatMessage["parts"] };
      setMessages((m) => [...m, { id: `a-${Date.now()}`, role: "assistant", content: d.text, parts: d.parts }]);
      onReplied?.();
    }
    inputRef.current?.focus();
  };

  const pad = compact ? "px-3 py-3" : "px-5 py-6";
  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <div className={`flex-1 overflow-y-auto ${pad}`}>
        <div className={`mx-auto space-y-5 ${compact ? "" : "max-w-3xl"}`}>
          {loadError && <div className="rounded-md border border-destructive p-3 text-sm text-destructive">Could not load: {loadError} <Button size="sm" variant="link" onClick={() => setReloadKey((k) => k + 1)}>Retry</Button></div>}
          {!threadId && (
            <div className={compact ? "py-8 text-center" : "py-16 text-center"}>
              <p className="text-muted-foreground mb-4 text-sm">Ask about orders, invoices, packages, tickets, or tell me what to create.</p>
              <Button onClick={onNewChat}><Plus className="mr-2 h-4 w-4" />Start a chat</Button>
            </div>
          )}
          {messages.map((m) => m.role === "user" ? (
            <div key={m.id} className="flex justify-end"><div className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground">{m.content}</div></div>
          ) : (
            <div key={m.id} className="space-y-2">
              {!!m.parts.trace?.length && (
                <details className="rounded-md border border-border text-xs">
                  <summary className="flex cursor-pointer items-center gap-1 px-3 py-2 text-muted-foreground"><ChevronRight className="h-3 w-3" />Steps used ({m.parts.trace.length})</summary>
                  <div className="space-y-2 px-3 pb-3">{m.parts.trace.map((t, i) => (
                    <div key={i}><span className="font-mono font-semibold">{t.tool}</span> <span className="font-mono text-muted-foreground break-all">{JSON.stringify(t.args)}</span><pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-muted p-2">{t.result}</pre></div>
                  ))}</div>
                </details>
              )}
              <AssistantMarkdown content={m.content} />
              {m.parts.trace?.filter((t) => (t.tool === "remember_fact" || t.tool === "update_fact") && t.result.includes('"learned":true')).map((t, i) => (
                <div key={`l${i}`} className="flex items-start gap-1.5 rounded-md bg-muted px-3 py-1.5 text-xs text-muted-foreground"><Brain className="mt-0.5 h-3 w-3 shrink-0" /><span><b>Learned:</b> {String(t.args.content ?? "")}</span></div>
              ))}
              {m.parts.actions?.map((a) => <ConfirmActionCard key={a} actionId={a} />)}
            </div>
          ))}
          {sending && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Thinking…</div>}
          <div ref={endRef} />
        </div>
      </div>
      {threadId && (
        <div className={`border-t border-border ${compact ? "p-3" : "p-4"}`}>
          <div className={`mx-auto flex items-end gap-2 ${compact ? "" : "max-w-3xl"}`}>
            <Textarea ref={inputRef} autoFocus value={input} rows={2} placeholder="e.g. How many orders this month?" className="resize-none"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
            <Button size="icon" className="h-10 w-10 shrink-0" disabled={sending || !input.trim()} onClick={send} aria-label="Send"><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
