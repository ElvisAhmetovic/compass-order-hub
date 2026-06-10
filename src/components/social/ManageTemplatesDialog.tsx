import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  ChecklistPriority,
  ChecklistTemplate,
  SocialPlatform,
  createTemplate,
  deleteTemplate,
  listTemplates,
  updateTemplate,
} from "@/services/socialChecklistService";
import { Plus, Trash2, Save, Pencil, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  platform: SocialPlatform;
  platformLabel: string;
}

const ManageTemplatesDialog = ({ open, onClose, platform, platformLabel }: Props) => {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  // create form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [time, setTime] = useState("");
  const [priority, setPriority] = useState<ChecklistPriority>("medium");

  // edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editPatch, setEditPatch] = useState<Partial<ChecklistTemplate>>({});

  const load = async () => {
    setLoading(true);
    try {
      setTemplates(await listTemplates(platform));
    } catch (e: any) {
      toast({ title: "Failed to load templates", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (open) load(); /* eslint-disable-next-line */ }, [open, platform]);

  const handleAdd = async () => {
    if (!title.trim()) { toast({ title: "Title is required", variant: "destructive" }); return; }
    try {
      await createTemplate({
        platform,
        title: title.trim(),
        description: description.trim() || null,
        link_url: link.trim() || null,
        scheduled_time: time || null,
        priority,
        sort_order: templates.length,
      });
      setTitle(""); setDescription(""); setLink(""); setTime(""); setPriority("medium");
      await load();
      toast({ title: "Template added" });
    } catch (e: any) {
      toast({ title: "Failed", description: e?.message, variant: "destructive" });
    }
  };

  const startEdit = (t: ChecklistTemplate) => {
    setEditId(t.id);
    setEditPatch({ title: t.title, description: t.description, link_url: t.link_url, scheduled_time: t.scheduled_time, priority: t.priority });
  };

  const saveEdit = async () => {
    if (!editId) return;
    try {
      await updateTemplate(editId, editPatch as any);
      setEditId(null); setEditPatch({});
      await load();
      toast({ title: "Template updated" });
    } catch (e: any) {
      toast({ title: "Failed", description: e?.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    try {
      await deleteTemplate(id);
      await load();
    } catch (e: any) {
      toast({ title: "Failed", description: e?.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{platformLabel} — checklist templates</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <p className="text-sm font-medium">Add a new template item</p>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title *" />
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Description (optional)" />
            <div className="grid grid-cols-3 gap-2">
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              <Select value={priority} onValueChange={(v) => setPriority(v as ChecklistPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
              <Input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="Link (optional)" />
            </div>
            <Button onClick={handleAdd} size="sm"><Plus className="w-4 h-4 mr-1" /> Add to templates</Button>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Saved templates ({templates.length})</p>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : templates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No templates yet. Add items above to build a daily default list.</p>
            ) : (
              templates.map((t) => (
                <div key={t.id} className="border rounded-md p-3 space-y-2">
                  {editId === t.id ? (
                    <>
                      <Input value={editPatch.title ?? ""} onChange={(e) => setEditPatch((p) => ({ ...p, title: e.target.value }))} />
                      <Textarea rows={2} value={editPatch.description ?? ""} onChange={(e) => setEditPatch((p) => ({ ...p, description: e.target.value }))} />
                      <div className="grid grid-cols-3 gap-2">
                        <Input type="time" value={editPatch.scheduled_time ?? ""} onChange={(e) => setEditPatch((p) => ({ ...p, scheduled_time: e.target.value || null }))} />
                        <Select value={(editPatch.priority as ChecklistPriority) ?? "medium"} onValueChange={(v) => setEditPatch((p) => ({ ...p, priority: v as ChecklistPriority }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input type="url" value={editPatch.link_url ?? ""} onChange={(e) => setEditPatch((p) => ({ ...p, link_url: e.target.value || null }))} />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveEdit}><Save className="w-4 h-4 mr-1" /> Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => { setEditId(null); setEditPatch({}); }}><X className="w-4 h-4 mr-1" /> Cancel</Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{t.title}</p>
                        {t.description && <p className="text-sm text-muted-foreground line-clamp-2">{t.description}</p>}
                        <p className="text-xs text-muted-foreground mt-1">
                          {t.priority} · {t.scheduled_time ?? "no time"}{t.link_url ? ` · ${t.link_url}` : ""}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="icon" variant="ghost" onClick={() => startEdit(t)}><Pencil className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(t.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageTemplatesDialog;
