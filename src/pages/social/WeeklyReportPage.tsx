import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Sidebar from "@/components/dashboard/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CalendarIcon, Copy, Download, BarChart3 } from "lucide-react";
import { addDays, endOfMonth, endOfWeek, format, parseISO, startOfMonth, startOfWeek, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import {
  MetricPeriodType,
  PlatformMetric,
  SocialChecklistItem,
  SocialPlatform,
  deletePlatformMetric,
  listItemsRange,
  listPlatformMetricsInRange,
} from "@/services/socialChecklistService";
import { toast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import PlatformMetricsCard from "@/components/social/PlatformMetricsCard";
import { Trash2, Pencil } from "lucide-react";

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  twitter: "Twitter (X)",
  abm_website: "ABM Website",
};

const fmt = (d: Date) => format(d, "yyyy-MM-dd");

const WeeklyReportPage = () => {
  const { platform: platformParam } = useParams<{ platform: string }>();
  const platform = (platformParam?.replace("-", "_") as SocialPlatform) || ("facebook" as SocialPlatform);
  const platformLabel = PLATFORM_LABELS[platform] ?? platform;
  const { user } = useAuth();
  const navigate = useNavigate();

  const today = new Date();
  const [from, setFrom] = useState(fmt(startOfWeek(today, { weekStartsOn: 1 })));
  const [to, setTo] = useState(fmt(endOfWeek(today, { weekStartsOn: 1 })));
  const [items, setItems] = useState<SocialChecklistItem[]>([]);
  const [platformMetrics, setPlatformMetrics] = useState<PlatformMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [focusPeriod, setFocusPeriod] = useState<{ period_type: MetricPeriodType; period_start: string } | null>(null);

  const handleEditMetric = (m: PlatformMetric) => {
    setFocusPeriod({ period_type: m.period_type, period_start: m.period_start });
    const el = document.getElementById("platform-metrics-card");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleDeleteMetric = async (m: PlatformMetric) => {
    if (!confirm("Delete this entry?")) return;
    try {
      await deletePlatformMetric(m.id);
      toast({ title: "Deleted" });
      setReloadKey((k) => k + 1);
    } catch (e: any) {
      toast({ title: "Failed to delete", description: e?.message, variant: "destructive" });
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const [data, metrics] = await Promise.all([
        listItemsRange(platform, from, to),
        listPlatformMetricsInRange(platform, from, to),
      ]);
      setItems(data);
      setPlatformMetrics(metrics);
    } catch (e: any) {
      toast({ title: "Failed to load", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [platform, from, to, reloadKey]);

  const isWeb = platform === "abm_website";

  const stats = useMemo(() => {
    const total = items.length;
    const done = items.filter((i) => i.is_done).length;
    const overdue = items.filter((i) => !i.is_done && i.checklist_date < fmt(today)).length;
    const itemTotals = items.reduce(
      (a, i) => ({
        likes: a.likes + (i.likes ?? 0),
        shares: a.shares + (i.shares ?? 0),
        comments: a.comments + (i.comments ?? 0),
        reach: a.reach + (i.reach ?? 0),
        impressions: a.impressions + (i.impressions ?? 0),
      }),
      { likes: 0, shares: 0, comments: 0, reach: 0, impressions: 0 },
    );
    const sumPlatform = (key: keyof PlatformMetric) => {
      const rows = platformMetrics.filter((m) => m[key] != null);
      if (rows.length === 0) return null;
      return rows.reduce((s, r) => s + ((r[key] as number) ?? 0), 0);
    };
    const avgPlatform = (key: keyof PlatformMetric) => {
      const rows = platformMetrics.filter((m) => m[key] != null);
      if (rows.length === 0) return null;
      const sum = rows.reduce((s, r) => s + ((r[key] as number) ?? 0), 0);
      return sum / rows.length;
    };
    const pickWithSource = (key: "likes" | "shares" | "comments" | "reach" | "impressions") => {
      const p = sumPlatform(key);
      if (p != null) return { value: p, source: "platform" as const };
      return { value: itemTotals[key], source: "items" as const };
    };
    const totals = {
      likes: pickWithSource("likes"),
      shares: pickWithSource("shares"),
      comments: pickWithSource("comments"),
      reach: pickWithSource("reach"),
      impressions: pickWithSource("impressions"),
    };
    // Web (GSC/GA) totals — always from platform metrics rows
    const webTotals = {
      clicks: sumPlatform("clicks") ?? 0,
      impressions: sumPlatform("impressions") ?? 0,
      ctr: avgPlatform("ctr"),
      avg_position: avgPlatform("avg_position"),
      users: sumPlatform("users") ?? 0,
      sessions: sumPlatform("sessions") ?? 0,
    };
    const byDay = new Map<string, { date: string; completed: number; total: number }>();
    for (const it of items) {
      const b = byDay.get(it.checklist_date) ?? { date: it.checklist_date, completed: 0, total: 0 };
      b.total += 1;
      if (it.is_done) b.completed += 1;
      byDay.set(it.checklist_date, b);
    }
    const chartData = Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date));
    const top = [...items]
      .map((i) => ({ ...i, eng: (i.likes ?? 0) + (i.shares ?? 0) + (i.comments ?? 0) }))
      .filter((i) => i.eng > 0)
      .sort((a, b) => b.eng - a.eng)
      .slice(0, 5);
    return { total, done, overdue, totals, webTotals, chartData, top };
  }, [items, platformMetrics]);

  const setPreset = (kind: "this_week" | "last_week" | "this_month") => {
    if (kind === "this_week") {
      setFrom(fmt(startOfWeek(today, { weekStartsOn: 1 })));
      setTo(fmt(endOfWeek(today, { weekStartsOn: 1 })));
    } else if (kind === "last_week") {
      const lw = subDays(startOfWeek(today, { weekStartsOn: 1 }), 7);
      setFrom(fmt(lw));
      setTo(fmt(addDays(lw, 6)));
    } else {
      setFrom(fmt(startOfMonth(today)));
      setTo(fmt(endOfMonth(today)));
    }
  };

  const buildMarkdown = () => {
    const lines: string[] = [];
    lines.push(`# ${platformLabel} report — ${from} → ${to}`);
    lines.push("");
    lines.push(`- Completed: **${stats.done} / ${stats.total}** (${stats.total ? Math.round((stats.done / stats.total) * 100) : 0}%)`);
    lines.push(`- Overdue (past, not done): **${stats.overdue}**`);
    if (isWeb) {
      const w = stats.webTotals;
      lines.push(`- Clicks: ${w.clicks} · Impressions: ${w.impressions} · CTR: ${w.ctr != null ? w.ctr.toFixed(2) + "%" : "—"} · Avg. position: ${w.avg_position != null ? w.avg_position.toFixed(2) : "—"} · Users: ${w.users} · Sessions: ${w.sessions}`);
    } else {
      const tag = (s: "platform" | "items") => s === "platform" ? "[platform]" : "[items]";
      lines.push(`- Likes: ${stats.totals.likes.value} ${tag(stats.totals.likes.source)} · Shares: ${stats.totals.shares.value} ${tag(stats.totals.shares.source)} · Comments: ${stats.totals.comments.value} ${tag(stats.totals.comments.source)} · Reach: ${stats.totals.reach.value} ${tag(stats.totals.reach.source)} · Impressions: ${stats.totals.impressions.value} ${tag(stats.totals.impressions.source)}`);
    }
    if (platformMetrics.length > 0) {
      lines.push("");
      lines.push(isWeb ? "## Search & analytics entries" : "## Platform metrics entries");
      for (const m of platformMetrics) {
        const label = m.period_type === "day"
          ? m.period_start
          : m.period_type === "week"
            ? `Week of ${m.period_start}`
            : `Month ${m.period_start.slice(0, 7)}`;
        if (isWeb) {
          lines.push(`- ${label} — 🖱 ${m.clicks ?? 0} · 👁 ${m.impressions ?? 0} · CTR ${m.ctr ?? 0}% · pos ${m.avg_position ?? 0} · 👥 ${m.users ?? 0} · 📈 ${m.sessions ?? 0}`);
        } else {
          lines.push(`- ${label} — ❤ ${m.likes ?? 0} · ↻ ${m.shares ?? 0} · 💬 ${m.comments ?? 0} · 👥 ${m.reach ?? 0} · 👁 ${m.impressions ?? 0}`);
        }
      }
    }
    if (!isWeb && stats.top.length > 0) {
      lines.push("");
      lines.push("## Top performing");
      for (const t of stats.top) {
        lines.push(`- **${t.title}** (${t.checklist_date}) — ❤ ${t.likes ?? 0} · ↻ ${t.shares ?? 0} · 💬 ${t.comments ?? 0}`);
      }
    }
    return lines.join("\n");
  };

  const copyMarkdown = async () => {
    await navigator.clipboard.writeText(buildMarkdown());
    toast({ title: "Copied as Markdown" });
  };

  const downloadCsv = () => {
    const header = ["date","title","done","priority","scheduled_time","likes","shares","comments","reach","impressions"];
    const rows = items.map((i) => [
      i.checklist_date,
      `"${(i.title ?? "").replace(/"/g, '""')}"`,
      i.is_done ? "yes" : "no",
      i.priority,
      i.scheduled_time ?? "",
      i.likes ?? "",
      i.shares ?? "",
      i.comments ?? "",
      i.reach ?? "",
      i.impressions ?? "",
    ].join(","));
    const pmHeader = isWeb
      ? ["period_type","period_start","period_end","clicks","impressions","ctr","avg_position","users","sessions","note"]
      : ["period_type","period_start","period_end","likes","shares","comments","reach","impressions","note"];
    const pmRows = platformMetrics.map((m) => (isWeb ? [
      m.period_type,
      m.period_start,
      m.period_end,
      m.clicks ?? "",
      m.impressions ?? "",
      m.ctr ?? "",
      m.avg_position ?? "",
      m.users ?? "",
      m.sessions ?? "",
      `"${(m.note ?? "").replace(/"/g, '""')}"`,
    ] : [
      m.period_type,
      m.period_start,
      m.period_end,
      m.likes ?? "",
      m.shares ?? "",
      m.comments ?? "",
      m.reach ?? "",
      m.impressions ?? "",
      `"${(m.note ?? "").replace(/"/g, '""')}"`,
    ]).join(","));
    const sections: string[] = [];
    if (!isWeb) {
      sections.push("# Items", header.join(","), ...rows, "");
    }
    sections.push(isWeb ? "# Search & analytics" : "# Platform metrics", pmHeader.join(","), ...pmRows);
    const csv = sections.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${platform}-report-${from}_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Layout userRole={user.role}>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <Button variant="ghost" size="sm" onClick={() => navigate(`/social/${platformParam}`)} className="mb-2">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back to checklist
                </Button>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <BarChart3 className="w-7 h-7 text-primary" />
                  {platformLabel} report
                </h1>
                <p className="text-muted-foreground">{from} → {to}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPreset("this_week")}>This week</Button>
                <Button variant="outline" size="sm" onClick={() => setPreset("last_week")}>Last week</Button>
                <Button variant="outline" size="sm" onClick={() => setPreset("this_month")}>This month</Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("justify-start text-left font-normal")}>
                      <CalendarIcon className="mr-2 h-4 w-4" /> From: {from}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50 bg-popover" align="start">
                    <Calendar mode="single" selected={parseISO(from)} onSelect={(d) => d && setFrom(fmt(d))} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("justify-start text-left font-normal")}>
                      <CalendarIcon className="mr-2 h-4 w-4" /> To: {to}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50 bg-popover" align="start">
                    <Calendar mode="single" selected={parseISO(to)} onSelect={(d) => d && setTo(fmt(d))} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                <Button variant="outline" onClick={copyMarkdown}><Copy className="w-4 h-4 mr-1" /> Markdown</Button>
                <Button variant="outline" onClick={downloadCsv}><Download className="w-4 h-4 mr-1" /> CSV</Button>
              </div>
            </div>

            <div id="platform-metrics-card">
              <PlatformMetricsCard
                platform={platform}
                platformLabel={platformLabel}
                onChanged={() => setReloadKey((k) => k + 1)}
                externalReloadKey={reloadKey}
                focusPeriod={focusPeriod}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="p-4">
                <div className="text-xs text-muted-foreground">Completion rate</div>
                <div className="text-2xl font-bold">{stats.total ? Math.round((stats.done / stats.total) * 100) : 0}%</div>
                <div className="text-xs text-muted-foreground">{stats.done} / {stats.total}</div>
              </Card>
              <Card className="p-4">
                <div className="text-xs text-muted-foreground">Overdue</div>
                <div className="text-2xl font-bold">{stats.overdue}</div>
              </Card>
              {isWeb ? (
                <>
                  <Card className="p-4">
                    <div className="text-xs text-muted-foreground">Clicks / Impressions</div>
                    <div className="text-2xl font-bold">{stats.webTotals.clicks.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">
                      {stats.webTotals.impressions.toLocaleString()} impressions · CTR {stats.webTotals.ctr != null ? stats.webTotals.ctr.toFixed(2) + "%" : "—"}
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-xs text-muted-foreground">Avg. position / Users</div>
                    <div className="text-2xl font-bold">
                      {stats.webTotals.avg_position != null ? stats.webTotals.avg_position.toFixed(1) : "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {stats.webTotals.users.toLocaleString()} users · {stats.webTotals.sessions.toLocaleString()} sessions
                    </div>
                  </Card>
                </>
              ) : (
                <>
                  <Card className="p-4">
                    <div className="text-xs text-muted-foreground flex items-center justify-between">
                      <span>Engagement</span>
                      <Badge variant="outline" className="text-[10px]">{stats.totals.likes.source === "platform" ? "platform" : "items"}</Badge>
                    </div>
                    <div className="text-2xl font-bold">{stats.totals.likes.value + stats.totals.shares.value + stats.totals.comments.value}</div>
                    <div className="text-xs text-muted-foreground">❤ {stats.totals.likes.value} · ↻ {stats.totals.shares.value} · 💬 {stats.totals.comments.value}</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-xs text-muted-foreground flex items-center justify-between">
                      <span>Reach / Impressions</span>
                      <Badge variant="outline" className="text-[10px]">{stats.totals.reach.source === "platform" ? "platform" : "items"}</Badge>
                    </div>
                    <div className="text-2xl font-bold">{stats.totals.reach.value}</div>
                    <div className="text-xs text-muted-foreground">{stats.totals.impressions.value} impressions</div>
                  </Card>
                </>
              )}
            </div>

            <Card className="p-4">
              <div className="font-medium mb-3">Completed per day</div>
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : stats.chartData.length === 0 ? (
                <div className="text-sm text-muted-foreground">No data in range.</div>
              ) : (
                <div style={{ width: "100%", height: 220 }}>
                  <ResponsiveContainer>
                    <BarChart data={stats.chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis allowDecimals={false} fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="completed" fill="hsl(var(--primary))" />
                      <Bar dataKey="total" fill="hsl(var(--muted-foreground))" opacity={0.4} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {isWeb ? (
              <Card className="p-4">
                <div className="font-medium mb-3">Recent search performance</div>
                {platformMetrics.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No search analytics entries in this range yet. Log GSC numbers above.</div>
                ) : (
                  <div className="space-y-2">
                    {platformMetrics.map((m) => (
                      <div key={m.id} className="flex items-start justify-between gap-2 border rounded-md p-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">
                            {m.period_type === "day" ? m.period_start : m.period_type === "week" ? `Week of ${m.period_start}` : `Month ${m.period_start.slice(0, 7)}`}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            🖱 {m.clicks ?? 0} · 👁 {m.impressions ?? 0} · CTR {m.ctr ?? 0}% · pos {m.avg_position ?? 0} · 👥 {m.users ?? 0} · 📈 {m.sessions ?? 0}
                          </div>
                          {m.note && m.note.trim().length > 0 && (
                            <div className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap break-words">
                              📝 {m.note}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button size="sm" variant="ghost" onClick={() => handleEditMetric(m)}>
                            <Pencil className="w-4 h-4 mr-1" /> Edit
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDeleteMetric(m)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ) : (
              <Card className="p-4">
                <div className="font-medium mb-3">Top performing items</div>
                {stats.top.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Add engagement numbers to completed items to populate this.</div>
                ) : (
                  <div className="space-y-2">
                    {stats.top.map((t) => (
                      <div key={t.id} className="flex items-center justify-between border rounded-md p-2">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{t.title}</div>
                          <div className="text-xs text-muted-foreground">{t.checklist_date}</div>
                        </div>
                        <div className="flex gap-2 text-xs">
                          <Badge variant="secondary">❤ {t.likes ?? 0}</Badge>
                          <Badge variant="secondary">↻ {t.shares ?? 0}</Badge>
                          <Badge variant="secondary">💬 {t.comments ?? 0}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>
        </Layout>
      </div>
    </div>
  );
};

export default WeeklyReportPage;
