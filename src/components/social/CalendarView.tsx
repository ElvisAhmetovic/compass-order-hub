import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  SocialChecklistItem,
  SocialPlatform,
  listItemsRange,
  rescheduleItem,
} from "@/services/socialChecklistService";

interface Props {
  platform: SocialPlatform;
  mode: "week" | "month";
  anchorDate: string; // yyyy-MM-dd
  onAnchorChange: (date: string) => void;
  onPickDate: (date: string) => void; // jump to day view
}

const priorityDot: Record<string, string> = {
  low: "bg-muted-foreground",
  medium: "bg-blue-500",
  high: "bg-red-500",
};

const fmt = (d: Date) => format(d, "yyyy-MM-dd");

function DraggableItem({ item }: { item: SocialChecklistItem }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: item.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "border rounded px-2 py-1 text-xs bg-card hover:bg-accent cursor-grab flex items-start gap-1",
        isDragging && "opacity-50",
        item.is_done && "opacity-60 line-through",
      )}
    >
      <GripVertical className="w-3 h-3 mt-0.5 text-muted-foreground shrink-0" />
      <span className={cn("w-1.5 h-1.5 rounded-full mt-1 shrink-0", priorityDot[item.priority])} />
      <div className="min-w-0 flex-1">
        <div className="truncate">{item.title}</div>
        {item.scheduled_time && (
          <div className="text-[10px] text-muted-foreground">{item.scheduled_time.slice(0, 5)}</div>
        )}
      </div>
    </div>
  );
}

function DroppableDay({
  date,
  items,
  isToday,
  inMonth,
  onClick,
}: {
  date: Date;
  items: SocialChecklistItem[];
  isToday: boolean;
  inMonth?: boolean;
  onClick: () => void;
}) {
  const id = fmt(date);
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "border rounded-md p-2 min-h-[120px] flex flex-col gap-1 transition-colors",
        isOver && "bg-accent/50 border-primary",
        !inMonth && inMonth !== undefined && "bg-muted/30 opacity-70",
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex items-center justify-between text-xs font-medium hover:text-primary"
      >
        <span className={cn(isToday && "text-primary")}>{format(date, "EEE d")}</span>
        {items.length > 0 && (
          <Badge variant="secondary" className="text-[10px] h-4">{items.length}</Badge>
        )}
      </button>
      <div className="space-y-1 flex-1">
        {items.slice(0, 6).map((it) => <DraggableItem key={it.id} item={it} />)}
        {items.length > 6 && (
          <div className="text-[10px] text-muted-foreground">+{items.length - 6} more</div>
        )}
      </div>
    </div>
  );
}

const CalendarView = ({ platform, mode, anchorDate, onAnchorChange, onPickDate }: Props) => {
  const anchor = parseISO(anchorDate);
  const [items, setItems] = useState<SocialChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const { from, to, days } = useMemo(() => {
    if (mode === "week") {
      const s = startOfWeek(anchor, { weekStartsOn: 1 });
      const e = endOfWeek(anchor, { weekStartsOn: 1 });
      const arr = Array.from({ length: 7 }, (_, i) => addDays(s, i));
      return { from: fmt(s), to: fmt(e), days: arr };
    }
    const monthStart = startOfMonth(anchor);
    const monthEnd = endOfMonth(anchor);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const arr: Date[] = [];
    for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) arr.push(d);
    return { from: fmt(gridStart), to: fmt(gridEnd), days: arr };
  }, [mode, anchorDate]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listItemsRange(platform, from, to);
      setItems(data);
    } catch (e: any) {
      toast({ title: "Failed to load", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [platform, from, to]);

  const byDate = useMemo(() => {
    const map = new Map<string, SocialChecklistItem[]>();
    for (const it of items) {
      const arr = map.get(it.checklist_date) ?? [];
      arr.push(it);
      map.set(it.checklist_date, arr);
    }
    return map;
  }, [items]);

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    const itemId = String(active.id);
    const newDate = String(over.id);
    const item = items.find((i) => i.id === itemId);
    if (!item || item.checklist_date === newDate) return;
    // optimistic
    setItems((prev) => prev.map((i) => i.id === itemId ? { ...i, checklist_date: newDate } : i));
    try {
      await rescheduleItem(itemId, newDate);
      toast({ title: "Rescheduled", description: `Moved to ${newDate}` });
    } catch (err: any) {
      toast({ title: "Failed to move", description: err?.message, variant: "destructive" });
      load();
    }
  };

  const today = fmt(new Date());

  const goPrev = () => onAnchorChange(fmt(mode === "week" ? addDays(anchor, -7) : subMonths(anchor, 1)));
  const goNext = () => onAnchorChange(fmt(mode === "week" ? addDays(anchor, 7) : addMonths(anchor, 1)));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goPrev}><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="outline" size="icon" onClick={goNext}><ChevronRight className="w-4 h-4" /></Button>
          <div className="font-medium ml-2">
            {mode === "week"
              ? `${format(days[0], "MMM d")} – ${format(days[6], "MMM d, yyyy")}`
              : format(anchor, "MMMM yyyy")}
          </div>
        </div>
        {loading && <div className="text-xs text-muted-foreground">Loading…</div>}
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        {mode === "week" ? (
          <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
            {days.map((d) => (
              <DroppableDay
                key={fmt(d)}
                date={d}
                items={byDate.get(fmt(d)) ?? []}
                isToday={fmt(d) === today}
                onClick={() => onPickDate(fmt(d))}
              />
            ))}
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-7 gap-2 text-xs text-muted-foreground mb-1 px-1">
              {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {days.map((d) => (
                <DroppableDay
                  key={fmt(d)}
                  date={d}
                  items={byDate.get(fmt(d)) ?? []}
                  isToday={fmt(d) === today}
                  inMonth={isSameMonth(d, anchor)}
                  onClick={() => onPickDate(fmt(d))}
                />
              ))}
            </div>
          </div>
        )}
      </DndContext>
    </div>
  );
};

export default CalendarView;
