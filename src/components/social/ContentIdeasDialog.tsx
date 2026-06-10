import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trash2, Plus, ExternalLink, ArrowRight, Archive } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  ContentIdea,
  IdeaStatus,
  SocialPlatform,
  createIdea,
  deleteIdea,
  listIdeas,
  updateIdea,
  useIdeaOnDate,
} from "@/services/socialChecklistService";

interface Props {
  open: boolean;
  onClose: () => void;
  platform: SocialPlatform;
  platformLabel: string;
  currentDate: string;
  onUsed?: () => void;
}

const ContentIdeasDialog = ({ open, onClose, platform, platformLabel, currentDate, onUsed }: Props) => {
  const [status, setStatus] = useState<IdeaStatus>("open");
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  // form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listIdeas(platform, status);
      setIdeas(data);
    } catch (e: any) {
      toast({ title: "Failed to load ideas", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, platform, status]);

  const add = async () => {
    if (!title.trim()) return;
    setBusy(true);
    try {
      await createIdea({
        platform,
        title: title.trim(),
        description: description.trim() || null,
        link_url: linkUrl.trim() || null,
        tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
      });
      setTitle(""); setDescription(""); setLinkUrl(""); setTagsInput("");
      await load();
    } catch (e: any) {
      toast({ title: "Failed to add idea", description: e?.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const use = async (idea: ContentIdea) => {
    setBusy(true);
    try {
      await useIdeaOnDate(idea, currentDate);
      toast({ title: "Added to checklist", description: currentDate });
      await load();
      onUsed?.();
    } catch (e: any) {
      toast({ title: "Failed to use idea", description: e?.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const archive = async (idea: ContentIdea) => {
    try {
      await updateIdea(idea.id, { status: "archived" });
      await load();
    } catch (e: any) {
      toast({ title: "Failed", description: e?.message, variant: "destructive" });
    }
  };

  const reopen = async (idea: ContentIdea) => {
    try {
      await updateIdea(idea.id, { status: "open" });
      await load();
    } catch (e: any) {
      toast({ title: "Failed", description: e?.message, variant: "destructive" });
    }
  };

  const remove = async (idea: ContentIdea) => {
    if (!confirm("Delete this idea?")) return;
    try {
      await deleteIdea(idea.id);
      await load();
    } catch (e: any) {
      toast({ title: "Failed", description: e?.message, variant: "destructive" });
    }
  };

  const filtered = ideas.filter((i) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      i.title.toLowerCase().includes(s) ||
      (i.description ?? "").toLowerCase().includes(s) ||
      i.tags.some((t) => t.toLowerCase().includes(s))
    );
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{platformLabel} — Content idea backlog</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 border rounded-md p-3 bg-muted/30">
          <div className="text-sm font-medium">Add a new idea</div>
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input placeholder="Link URL (optional)" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
            <Input placeholder="Tags (comma separated)" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={add} disabled={busy || !title.trim()}>
              <Plus className="w-4 h-4 mr-1" /> Add idea
            </Button>
          </div>
        </div>

        <Tabs value={status} onValueChange={(v) => setStatus(v as IdeaStatus)} className="mt-2">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <TabsList>
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="used">Used</TabsTrigger>
              <TabsTrigger value="archived">Archived</TabsTrigger>
            </TabsList>
            <Input
              className="sm:max-w-xs"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <TabsContent value={status} className="mt-3">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-6">No ideas here yet.</div>
            ) : (
              <div className="space-y-2">
                {filtered.map((idea) => (
                  <div key={idea.id} className="border rounded-md p-3 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{idea.title}</div>
                      {idea.description && (
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">{idea.description}</div>
                      )}
                      {idea.link_url && (
                        <a href={idea.link_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1">
                          <ExternalLink className="w-3 h-3" /> {idea.link_url}
                        </a>
                      )}
                      {idea.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {idea.tags.map((t) => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                        </div>
                      )}
                      {idea.status === "used" && idea.used_on_date && (
                        <div className="text-xs text-muted-foreground mt-2">Used on {idea.used_on_date}</div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      {idea.status === "open" && (
                        <Button size="sm" onClick={() => use(idea)} disabled={busy}>
                          <ArrowRight className="w-4 h-4 mr-1" /> Use
                        </Button>
                      )}
                      {idea.status === "open" && (
                        <Button size="sm" variant="outline" onClick={() => archive(idea)}>
                          <Archive className="w-4 h-4" />
                        </Button>
                      )}
                      {idea.status !== "open" && (
                        <Button size="sm" variant="outline" onClick={() => reopen(idea)}>Reopen</Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => remove(idea)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContentIdeasDialog;
