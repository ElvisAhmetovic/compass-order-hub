import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { SocialChecklistItem, updatePerformance } from "@/services/socialChecklistService";

interface Props {
  item: SocialChecklistItem;
  onSaved: () => void;
  onCancel: () => void;
}

const toNum = (v: string): number | null => {
  if (v.trim() === "") return null;
  const n = parseInt(v.replace(/[^\d-]/g, ""), 10);
  return Number.isNaN(n) ? null : n;
};

const PerformanceForm = ({ item, onSaved, onCancel }: Props) => {
  const [likes, setLikes] = useState(item.likes?.toString() ?? "");
  const [shares, setShares] = useState(item.shares?.toString() ?? "");
  const [comments, setComments] = useState(item.comments?.toString() ?? "");
  const [reach, setReach] = useState(item.reach?.toString() ?? "");
  const [impressions, setImpressions] = useState(item.impressions?.toString() ?? "");
  const [note, setNote] = useState(item.performance_note ?? "");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await updatePerformance(item.id, {
        likes: toNum(likes),
        shares: toNum(shares),
        comments: toNum(comments),
        reach: toNum(reach),
        impressions: toNum(impressions),
        performance_note: note.trim() || null,
      });
      toast({ title: "Performance saved" });
      onSaved();
    } catch (e: any) {
      toast({ title: "Failed to save", description: e?.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 border-t pt-3 mt-3">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <div>
          <Label className="text-xs">Likes</Label>
          <Input value={likes} onChange={(e) => setLikes(e.target.value)} inputMode="numeric" />
        </div>
        <div>
          <Label className="text-xs">Shares</Label>
          <Input value={shares} onChange={(e) => setShares(e.target.value)} inputMode="numeric" />
        </div>
        <div>
          <Label className="text-xs">Comments</Label>
          <Input value={comments} onChange={(e) => setComments(e.target.value)} inputMode="numeric" />
        </div>
        <div>
          <Label className="text-xs">Reach</Label>
          <Input value={reach} onChange={(e) => setReach(e.target.value)} inputMode="numeric" />
        </div>
        <div>
          <Label className="text-xs">Impressions</Label>
          <Input value={impressions} onChange={(e) => setImpressions(e.target.value)} inputMode="numeric" />
        </div>
      </div>
      <div>
        <Label className="text-xs">Note</Label>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="What worked / didn't" />
      </div>
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="outline" onClick={onCancel} disabled={busy}>Cancel</Button>
        <Button size="sm" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save metrics"}</Button>
      </div>
    </div>
  );
};

export default PerformanceForm;
