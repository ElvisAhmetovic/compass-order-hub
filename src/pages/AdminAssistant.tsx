import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "@/components/dashboard/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Bot, Plus, Trash2 } from "lucide-react";
import { AssistantChat, useAssistantThreads } from "@/components/assistant/AssistantChat";
import { assistantPath } from "@/components/assistant/assistantView";
import ReplyFollowUpTemplate from "@/components/assistant/ReplyFollowUpTemplate";

export default function AdminAssistant() {
  const { user } = useAuth();
  const { threadId } = useParams();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
  const { threads, error, reload, create, remove } = useAssistantThreads(isAdmin);

  const newThread = async () => { const id = await create(); if (id) navigate(assistantPath(id)); return id; };
  const del = async (id: string) => { if ((await remove(id)) && id === threadId) navigate(assistantPath()); };

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
            {error && <p className="px-3 py-2 text-xs text-destructive">Could not load chats. <button className="underline" onClick={reload}>Retry</button></p>}
            {threads.map((t) => (
              <div key={t.id} className={`group flex items-center rounded-md text-sm ${t.id === threadId ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}>
                <button className="flex-1 truncate px-3 py-2 text-left" onClick={() => navigate(assistantPath(t.id))}>{t.title}</button>
                <button aria-label="Delete chat" className="px-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => del(t.id)}><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
            {!threads.length && !error && <p className="px-3 py-2 text-xs text-muted-foreground">No chats yet.</p>}
          </nav>
        </aside>
        <main className="flex-1 flex flex-col min-w-0">
          <header className="flex items-center gap-3 border-b border-border px-5 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground"><Bot className="h-5 w-5" /></div>
            <div><h1 className="font-semibold leading-tight">Empria Assistant</h1><p className="text-xs text-muted-foreground">Asks before changing anything</p></div>
            <div className="ml-auto"><ReplyFollowUpTemplate /></div>
            <Button size="sm" variant="outline" className="md:hidden" onClick={newThread}><Plus className="h-4 w-4" /></Button>
          </header>
          <AssistantChat threadId={threadId ?? null} onNewChat={newThread} onReplied={reload} />
        </main>
      </div>
    </div>
  );
}
