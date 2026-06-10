import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ChecklistPriority, createItem, SocialPlatform } from "@/services/socialChecklistService";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  platform: SocialPlatform;
  date: string;
}

const AddChecklistItemDialog = ({ open, onClose, onCreated, platform, date }: Props) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [time, setTime] = useState("");
  const [priority, setPriority] = useState<ChecklistPriority>("medium");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setTitle(""); setDescription(""); setLink(""); setTime(""); setPriority("medium");
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await createItem({
        platform,
        checklist_date: date,
        title: title.trim(),
        description: description.trim() || null,
        link_url: link.trim() || null,
        scheduled_time: time || null,
        priority,
      });
      toast({ title: "Checklist item added" });
      reset();
      onCreated();
      onClose();
    } catch (e: any) {
      toast({ title: "Failed to add item", description: e?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add checklist item</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Post Reel about new campaign" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Notes, copy ideas, references…" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Time</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as ChecklistPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Link / URL</Label>
            <Input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onClose(); }} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? "Adding…" : "Add item"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddChecklistItemDialog;
