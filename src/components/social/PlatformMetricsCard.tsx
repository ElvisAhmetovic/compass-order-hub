import { useEffect, useState } from "react";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Save, Trash2, Gauge } from "lucide-react";
import {
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  MetricPeriodType,
  PlatformMetric,
  SocialPlatform,
  deletePlatformMetric,
  getPlatformMetric,
  listRecentPlatformMetrics,
  upsertPlatformMetric,
} from "@/services/socialChecklistService";

interface Props {
  platform: SocialPlatform;
  platformLabel: string;
  onChanged?: () => void;
}

const fmt = (d: Date) => format(d, "yyyy-MM-dd");

const computeRange = (type: MetricPeriodType, anchor: Date): { start: string; end: string } => {
  if (type === "day") return { start: fmt(anchor), end: fmt(anchor) };
  if (type === "week") {
    return { start: fmt(startOfWeek(anchor, { weekStartsOn: 1 })), end: fmt(endOfWeek(anchor, { weekStartsOn: 1 })) };
  }
  return { start: fmt(startOfMonth(anchor)), end: fmt(endOfMonth(anchor)) };
};

const periodLabel = (m: PlatformMetric) => {
  const s = parseISO(m.period_start);
  if (m.period_type === "day") return format(s, "PPP");
  if (m.period_type === "week") return `Week of ${format(s, "MMM d, yyyy")}`;
  return format(s, "MMMM yyyy");
};

const toNum = (v: string): number | null => {
  if (v.trim() === "") return null;
  const n = parseInt(v.replace(/\D/g, ""), 10);
  return Number.isNaN(n) ? null : n;
};
const toStr = (n: number | null | undefined) => (n == null ? "" : String(n));

const metricSchema = z.object({
  likes: z.number().int().min(0).nullable(),
  shares: z.number().int().min(0).nullable(),
  comments: z.number().int().min(0).nullable(),
  reach: z.number().int().min(0).nullable(),
  impressions: z.number().int().min(0).nullable(),
}).refine((data) => Object.values(data).some((v) => v != null && v > 0), {
  message: "At least one metric must be greater than 0",
});

type MetricErrors = Partial<Record<"likes" | "shares" | "comments" | "reach" | "impressions" | "_form", string>>;

const clampDigits = (v: string) => v.replace(/\D/g, "");

const PlatformMetricsCard = ({ platform, platformLabel, onChanged }: Props) => {
  const [periodType, setPeriodType] = useState<MetricPeriodType>("week");
  const [anchor, setAnchor] = useState<Date>(new Date());
  const range = computeRange(periodType, anchor);

  const [existingId, setExistingId] = useState<string | null>(null);
  const [likes, setLikes] = useState("");
  const [shares, setShares] = useState("");
  const [comments, setComments] = useState("");
  const [reach, setReach] = useState("");
  const [impressions, setImpressions] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<PlatformMetric[]>([]);
  const [fieldErrors, setFieldErrors] = useState<MetricErrors>({});

  const loadExisting = async () => {
    try {
      const row = await getPlatformMetric(platform, periodType, range.start);
      if (row) {
        setExistingId(row.id);
        setLikes(toStr(row.likes));
        setShares(toStr(row.shares));
        setComments(toStr(row.comments));
        setReach(toStr(row.reach));
        setImpressions(toStr(row.impressions));
        setNote(row.note ?? "");
      } else {
        setExistingId(null);
        setLikes(""); setShares(""); setComments(""); setReach(""); setImpressions(""); setNote("");
      }
    } catch (e: any) {
      toast({ title: "Failed to load entry", description: e?.message, variant: "destructive" });
    }
  };

  const loadHistory = async () => {
    try {
      const data = await listRecentPlatformMetrics(platform, 10);
      setHistory(data);
    } catch {
      /* noop */
    }
  };

  useEffect(() => { loadExisting(); /* eslint-disable-next-line */ }, [platform, periodType, range.start]);
  useEffect(() => { loadHistory(); /* eslint-disable-next-line */ }, [platform]);

  const validate = () => {
    const parsed = metricSchema.safeParse({
      likes: toNum(likes),
      shares: toNum(shares),
      comments: toNum(comments),
      reach: toNum(reach),
      impressions: toNum(impressions),
    });
    if (parsed.success) {
      setFieldErrors({});
      return true;
    }
    const next: MetricErrors = {};
    parsed.error.errors.forEach((err) => {
      const key = err.path[0] as keyof MetricErrors;
      if (key && !next[key]) next[key] = err.message;
    });
    setFieldErrors(next);
    return false;
  };

  const save = async () => {
    if (!validate()) return;
    setBusy(true);
    try {
      await upsertPlatformMetric({
        platform,
        period_type: periodType,
        period_start: range.start,
        period_end: range.end,
        likes: toNum(likes),
        shares: toNum(shares),
        comments: toNum(comments),
        reach: toNum(reach),
        impressions: toNum(impressions),
        note: note.trim() || null,
      });
      setFieldErrors({});
      toast({ title: "Platform metrics saved" });
      await Promise.all([loadExisting(), loadHistory()]);
      onChanged?.();
    } catch (e: any) {
      toast({ title: "Failed to save", description: e?.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!existingId) return;
    if (!confirm("Delete this metrics entry?")) return;
    setBusy(true);
    try {
      await deletePlatformMetric(existingId);
      toast({ title: "Deleted" });
      await Promise.all([loadExisting(), loadHistory()]);
      onChanged?.();
    } catch (e: any) {
      toast({ title: "Failed to delete", description: e?.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const removeFromHistory = async (m: PlatformMetric) => {
    if (!confirm("Delete this entry?")) return;
    try {
      await deletePlatformMetric(m.id);
      await Promise.all([loadExisting(), loadHistory()]);
      onChanged?.();
    } catch (e: any) {
      toast({ title: "Failed", description: e?.message, variant: "destructive" });
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Gauge className="w-5 h-5 text-primary" />
        <div className="font-medium">{platformLabel} — Platform metrics</div>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        Log overall engagement for {platformLabel}. These totals replace per-item sums in the report when present.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Tabs value={periodType} onValueChange={(v) => setPeriodType(v as MetricPeriodType)}>
          <TabsList>
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
        </Tabs>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("justify-start text-left font-normal")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {periodType === "day"
                ? format(anchor, "PPP")
                : periodType === "week"
                  ? `${format(parseISO(range.start), "MMM d")} – ${format(parseISO(range.end), "MMM d, yyyy")}`
                  : format(anchor, "MMMM yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-50 bg-popover" align="start">
            <Calendar
              mode="single"
              selected={anchor}
              onSelect={(d) => d && setAnchor(d)}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
        {existingId && <Badge variant="secondary">Editing existing entry</Badge>}
      </div>

      {fieldErrors._form && (
        <p className="text-xs text-destructive">{fieldErrors._form}</p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {([
          ["likes", likes, setLikes],
          ["shares", shares, setShares],
          ["comments", comments, setComments],
          ["reach", reach, setReach],
          ["impressions", impressions, setImpressions],
        ] as [keyof MetricErrors, string, React.Dispatch<React.SetStateAction<string>>][]).map(([key, value, setter]) => (
          <div key={key}>
            <Label className="text-xs capitalize">{key}</Label>
            <Input
              value={value}
              onChange={(e) => {
                setter(clampDigits(e.target.value));
                if (fieldErrors[key] || fieldErrors._form) {
                  setFieldErrors((prev) => { const n = { ...prev }; delete n[key]; delete n._form; return n; });
                }
              }}
              inputMode="numeric"
              min={0}
              className={cn(fieldErrors[key] && "border-destructive focus-visible:ring-destructive")}
            />
            {fieldErrors[key] && <p className="text-[10px] text-destructive mt-0.5">{fieldErrors[key]}</p>}
          </div>
        ))}
      </div>
      <div>
        <Label className="text-xs">Note</Label>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Anything to remember about this period" />
      </div>

      <div className="flex gap-2 justify-end">
        {existingId && (
          <Button variant="outline" onClick={remove} disabled={busy}>
            <Trash2 className="w-4 h-4 mr-1" /> Delete
          </Button>
        )}
        <Button onClick={save} disabled={busy}>
          <Save className="w-4 h-4 mr-1" /> {busy ? "Saving…" : existingId ? "Update" : "Save"}
        </Button>
      </div>

      {history.length > 0 && (
        <div className="pt-2 border-t">
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Recent entries</div>
          <div className="space-y-1">
            {history.map((m) => (
              <div key={m.id} className="flex items-center justify-between text-sm border rounded-md px-2 py-1">
                <div className="min-w-0">
                  <div className="font-medium truncate">{periodLabel(m)}</div>
                  <div className="text-xs text-muted-foreground">
                    ❤ {m.likes ?? 0} · ↻ {m.shares ?? 0} · 💬 {m.comments ?? 0} · 👥 {m.reach ?? 0} · 👁 {m.impressions ?? 0}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setPeriodType(m.period_type);
                      setAnchor(parseISO(m.period_start));
                    }}
                  >
                    Edit
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => removeFromHistory(m)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default PlatformMetricsCard;
