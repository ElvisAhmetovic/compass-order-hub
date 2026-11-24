import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bot, Maximize2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { AssistantChat, useAssistantThreads } from "./AssistantChat";
import { assistantPath } from "./assistantView";
import { showAssistantBubble } from "./bubbleVisibility";

const KEY = "assistant-bubble";

/** Floating assistant chat box for admins on every team page. */
export default function AssistantBubble() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const visible = showAssistantBubble(pathname, user?.role);
  const saved = (() => { try { return JSON.parse(sessionStorage.getItem(KEY) || "{}"); } catch { return {}; } })();
  const [open, setOpen] = useState<boolean>(!!saved.open);
  const [threadId, setThreadId] = useState<string | null>(saved.threadId ?? null);
  const { threads, reload, create } = useAssistantThreads(visible && open);

  useEffect(() => { sessionStorage.setItem(KEY, JSON.stringify({ open, threadId })); }, [open, threadId]);

  if (!visible) return null;
  const newChat = async () => { const id = await create(); if (id) setThreadId(id); };

  if (!open) return (
    <button aria-label="Open assistant" onClick={() => setOpen(true)}
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <Bot className="h-6 w-6" />
    </button>
  );

  return (
    <div role="dialog" aria-label="Empria Assistant" className="fixed bottom-5 right-5 z-50 flex h-[min(640px,calc(100vh-2.5rem))] w-[min(420px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-xl border border-border bg-background shadow-2xl">
      <header className="flex items-center gap-2 border-b border-border px-3 py-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><Bot className="h-4 w-4" /></div>
        <Select value={threadId ?? undefined} onValueChange={setThreadId}>
          <SelectTrigger className="h-8 min-w-0 flex-1 text-sm"><SelectValue placeholder="Recent chats" /></SelectTrigger>
          <SelectContent className="z-[60]">
            {threads.map((t) => <SelectItem key={t.id} value={t.id}><span className="block max-w-[260px] truncate">{t.title}</span></SelectItem>)}
            {!threads.length && <div className="px-3 py-2 text-xs text-muted-foreground">No chats yet.</div>}
          </SelectContent>
        </Select>
        <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="New chat" onClick={newChat}><Plus className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Open full page" onClick={() => { setOpen(false); navigate(assistantPath(threadId ?? undefined)); }}><Maximize2 className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Close assistant" onClick={() => setOpen(false)}><X className="h-4 w-4" /></Button>
      </header>
      <AssistantChat compact threadId={threadId} onNewChat={newChat} onReplied={reload} />
    </div>
  );
}
