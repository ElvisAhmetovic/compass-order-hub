import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, ExternalLink, Clock, Check, X } from "lucide-react";
import { SocialChecklistItem, softDelete, toggleDone } from "@/services/socialChecklistService";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface Props {
  item: SocialChecklistItem;
  onChanged: () => void;
}

const priorityColor: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  high: "bg-red-500/15 text-red-600 dark:text-red-400",
};

const ChecklistItemCard = ({ item, onChanged }: Props) => {
  const { user } = useAuth();
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const canDelete = user?.role === "admin" || user?.id === item.created_by;

  const handleToggle = async (checked: boolean) => {
    if (checked && !item.is_done) {
      setNoteOpen(true);
      return;
    }
    setBusy(true);
    try {
      await toggleDone(item.id, false);
      onChanged();
    } catch (e: any) {
      toast({ title: "Failed to update", description: e?.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const confirmDone = async () => {
    setBusy(true);
    try {
      await toggleDone(item.id, true, note.trim() || null);
      setNoteOpen(false);
      setNote("");
      onChanged();
    } catch (e: any) {
      toast({ title: "Failed to update", description: e?.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this checklist item?")) return;
    setBusy(true);
    try {
      await softDelete(item.id);
      onChanged();
    } catch (e: any) {
      toast({ title: "Failed to delete", description: e?.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className={cn("p-4", item.is_done && "bg-muted/40")}>
      <div className="flex items-start gap-3">
        <Checkbox
          checked={item.is_done}
          onCheckedChange={(c) => handleToggle(Boolean(c))}
          disabled={busy}
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={cn("font-medium", item.is_done && "line-through text-muted-foreground")}>
              {item.title}
            </h3>
            <div className="flex items-center gap-2 shrink-0">
              <Badge className={cn("capitalize", priorityColor[item.priority])} variant="secondary">
                {item.priority}
              </Badge>
              {item.scheduled_time && (
                <Badge variant="outline" className="gap-1">
                  <Clock className="w-3 h-3" />
                  {item.scheduled_time.slice(0, 5)}
                </Badge>
              )}
              {canDelete && (
                <Button size="icon" variant="ghost" onClick={handleDelete} disabled={busy}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
          {item.description && (
            <p className={cn("text-sm text-muted-foreground mt-1 whitespace-pre-wrap", item.is_done && "line-through")}>
              {item.description}
            </p>
          )}
          {item.link_url && (
            <a
              href={item.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
            >
              <ExternalLink className="w-3 h-3" />
              Open link
            </a>
          )}
          {item.is_done && item.done_note && (
            <div className="mt-2 text-xs text-muted-foreground italic">
              Note: {item.done_note}
            </div>
          )}

          {noteOpen && (
            <div className="mt-3 space-y-2 border-t pt-3">
              <Textarea
                placeholder="Optional completion note…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
              />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" onClick={() => { setNoteOpen(false); setNote(""); }} disabled={busy}>
                  <X className="w-4 h-4 mr-1" /> Cancel
                </Button>
                <Button size="sm" onClick={confirmDone} disabled={busy}>
                  <Check className="w-4 h-4 mr-1" /> Mark done
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ChecklistItemCard;
