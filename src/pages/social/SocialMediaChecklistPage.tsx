import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Sidebar from "@/components/dashboard/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Plus,
  ListChecks,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  LayoutTemplate,
  Wand2,
  Lightbulb,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { applyTemplatesToDate, listItems, SocialChecklistItem, SocialPlatform } from "@/services/socialChecklistService";
import { toast } from "@/hooks/use-toast";
import AddChecklistItemDialog from "@/components/social/AddChecklistItemDialog";
import ManageTemplatesDialog from "@/components/social/ManageTemplatesDialog";
import ContentIdeasDialog from "@/components/social/ContentIdeasDialog";
import BestTimesPanel from "@/components/social/BestTimesPanel";
import CalendarView from "@/components/social/CalendarView";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO, addDays, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import ChecklistItemCard from "@/components/social/ChecklistItemCard";

interface Props {
  platform: SocialPlatform;
  title: string;
}

const todayBerlin = () => {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" });
  return fmt.format(new Date());
};

type ViewMode = "day" | "week" | "month";

const SocialMediaChecklistPage = ({ platform, title }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [date, setDate] = useState<string>(todayBerlin());
  const [view, setView] = useState<ViewMode>("day");
  const [items, setItems] = useState<SocialChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [ideasOpen, setIdeasOpen] = useState(false);
  const [bestOpen, setBestOpen] = useState(false);
  const [applying, setApplying] = useState(false);

  const handleApplyTemplates = async () => {
    setApplying(true);
    try {
      const { inserted } = await applyTemplatesToDate(platform, date);
      if (inserted === 0) {
        toast({ title: "No templates yet", description: "Add some templates first." });
      } else {
        toast({ title: `Added ${inserted} item${inserted === 1 ? "" : "s"} from templates` });
        await load();
      }
    } catch (e: any) {
      toast({ title: "Failed to apply templates", description: e?.message, variant: "destructive" });
    } finally {
      setApplying(false);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listItems(platform, date);
      setItems(data);
    } catch (e: any) {
      toast({ title: "Failed to load checklist", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [platform, date]);

  useEffect(() => { if (view === "day") load(); }, [load, view]);

  if (!user) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex min-w-0">
          <Layout userRole="user">
            <div className="flex justify-center items-center h-64">
              <p className="text-muted-foreground">Please log in to access this page.</p>
            </div>
          </Layout>
        </div>
      </div>
    );
  }

  const doneCount = items.filter((i) => i.is_done).length;
  const isToday = date === todayBerlin();
  const platformSlug = platform.replace("_", "-");

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Layout userRole={user.role}>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <ListChecks className="w-7 h-7 text-primary" />
                  {title}
                </h1>
                <p className="text-muted-foreground">
                  {view === "day"
                    ? `Daily checklist ${isToday ? "for today" : `for ${format(parseISO(date), "PPP")}`} · ${doneCount} / ${items.length} done`
                    : view === "week"
                      ? "Week view — drag items between days to reschedule"
                      : "Month view — drag items between days to reschedule"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)}>
                  <TabsList>
                    <TabsTrigger value="day">Day</TabsTrigger>
                    <TabsTrigger value="week">Week</TabsTrigger>
                    <TabsTrigger value="month">Month</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button variant="outline" size="sm" onClick={() => setBestOpen((v) => !v)}>
                  <Sparkles className="w-4 h-4 mr-1" /> Best times
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIdeasOpen(true)}>
                  <Lightbulb className="w-4 h-4 mr-1" /> Ideas
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate(`/social/${platformSlug}/report`)}>
                  <BarChart3 className="w-4 h-4 mr-1" /> Report
                </Button>
              </div>
            </div>

            {view === "day" && (
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setDate(format(subDays(parseISO(date), 1), "yyyy-MM-dd"))} aria-label="Previous day">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("min-w-[200px] justify-start text-left font-normal")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(parseISO(date), "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50 bg-popover" align="start">
                    <Calendar
                      mode="single"
                      selected={parseISO(date)}
                      onSelect={(d) => d && setDate(format(d, "yyyy-MM-dd"))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                <Button variant="outline" size="icon" onClick={() => setDate(format(addDays(parseISO(date), 1), "yyyy-MM-dd"))} aria-label="Next day">
                  <ChevronRight className="w-4 h-4" />
                </Button>
                {!isToday && (
                  <Button variant="ghost" size="sm" onClick={() => setDate(todayBerlin())}>Today</Button>
                )}
                <Button variant="outline" onClick={handleApplyTemplates} disabled={applying}>
                  <Wand2 className="w-4 h-4 mr-1" /> {applying ? "Applying…" : "Apply template"}
                </Button>
                <Button variant="outline" onClick={() => setTemplatesOpen(true)}>
                  <LayoutTemplate className="w-4 h-4 mr-1" /> Templates
                </Button>
                <Button onClick={() => setAddOpen(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Add item
                </Button>
              </div>
            )}

            <div className={cn("grid gap-6", bestOpen ? "lg:grid-cols-[1fr_320px]" : "grid-cols-1")}>
              <div className="min-w-0">
                {view === "day" ? (
                  loading ? (
                    <div className="text-muted-foreground">Loading…</div>
                  ) : items.length === 0 ? (
                    <div className="border border-dashed rounded-lg p-12 text-center">
                      <ListChecks className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground mb-4">No checklist items {isToday ? "yet for today" : "for this date"}.</p>
                      <Button onClick={() => setAddOpen(true)}>
                        <Plus className="w-4 h-4 mr-1" /> Add your first item
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {items.map((item) => (
                        <ChecklistItemCard key={item.id} item={item} onChanged={load} />
                      ))}
                    </div>
                  )
                ) : (
                  <CalendarView
                    platform={platform}
                    mode={view}
                    anchorDate={date}
                    onAnchorChange={setDate}
                    onPickDate={(d) => { setDate(d); setView("day"); }}
                  />
                )}
              </div>
              {bestOpen && (
                <aside className="lg:sticky lg:top-4 lg:self-start">
                  <BestTimesPanel platform={platform} platformLabel={title} />
                </aside>
              )}
            </div>
          </div>

          <AddChecklistItemDialog
            open={addOpen}
            onClose={() => setAddOpen(false)}
            onCreated={load}
            platform={platform}
            date={date}
          />
          <ManageTemplatesDialog
            open={templatesOpen}
            onClose={() => setTemplatesOpen(false)}
            platform={platform}
            platformLabel={title}
          />
          <ContentIdeasDialog
            open={ideasOpen}
            onClose={() => setIdeasOpen(false)}
            platform={platform}
            platformLabel={title}
            currentDate={date}
            onUsed={load}
          />
        </Layout>
      </div>
    </div>
  );
};

export default SocialMediaChecklistPage;
