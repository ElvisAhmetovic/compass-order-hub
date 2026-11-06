import { useCallback, useEffect, useState } from "react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import Layout from "@/components/layout/Layout";
import Sidebar from "@/components/dashboard/Sidebar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Loader2, Plus, Sparkles, Trash2, Check, EyeOff, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Service = { id: string; name: string; description: string | null; typical_price: string | null; languages: string | null; active: boolean };
type Insight = { id: string; service_name: string; display_name: string | null; order_count: number; revenue: number; revenue_share: number; typical_clients: string | null; bought_with: string | null; confirmed: boolean; hidden: boolean; computed_at: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
const empty = { name: "", description: "", typical_price: "", languages: "" };
const eur = (n: number) => n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });

export default function ServicesKnowledge() {
  const [services, setServices] = useState<Service[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [form, setForm] = useState(empty);
  const [refreshing, setRefreshing] = useState(false);
  const [names, setNames] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const [s, i] = await Promise.all([
      db.from("service_catalog").select("*").order("name"),
      db.from("service_insights").select("*").order("order_count", { ascending: false }),
    ]);
    if (s.error || i.error) toast({ title: "Could not load", description: (s.error || i.error).message, variant: "destructive" });
    setServices(s.data ?? []); setInsights(i.data ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!form.name.trim()) return toast({ title: "Name is required", variant: "destructive" });
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await db.from("service_catalog").insert({
      name: form.name.trim().slice(0, 120), description: form.description.trim().slice(0, 1000) || null,
      typical_price: form.typical_price.trim().slice(0, 60) || null, languages: form.languages.trim().slice(0, 60) || null,
      created_by: auth.user?.id ?? null,
    });
    if (error) return toast({ title: "Could not save", description: error.message, variant: "destructive" });
    setForm(empty); toast({ title: "Service added" }); load();
  };
  const update = async (id: string, patch: Partial<Service>) => {
    const { error } = await db.from("service_catalog").update(patch).eq("id", id);
    if (error) toast({ title: "Could not save", description: error.message, variant: "destructive" });
    load();
  };
  const remove = async (s: Service) => {
    if (!confirm(`Delete "${s.name}"?`)) return;
    const { error } = await db.from("service_catalog").delete().eq("id", s.id);
    if (error) toast({ title: "Could not delete", description: error.message, variant: "destructive" });
    load();
  };
  const updateInsight = async (id: string, patch: Partial<Insight>) => {
    const { error } = await db.from("service_insights").update(patch).eq("id", id);
    if (error) toast({ title: "Could not save", description: error.message, variant: "destructive" });
    load();
  };
  const refresh = async () => {
    setRefreshing(true);
    const { data, error } = await supabase.functions.invoke("service-insights", { body: {} });
    setRefreshing(false);
    if (error) {
      const d = error instanceof FunctionsHttpError ? (await error.context.json().catch(() => ({})))?.error : error.message;
      return toast({ title: "Analysis failed", description: d, variant: "destructive" });
    }
    toast({ title: `${data?.services ?? 0} services found`, description: `${data?.orders ?? 0} orders analysed.` });
    load();
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex min-w-0">
        <Layout>
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Services Knowledge</h1>
                <p className="text-sm text-muted-foreground">What we sell and what clients buy. The AI uses only active services from here when writing offers.</p>
              </div>
            </div>

            <Card>
              <CardHeader><CardTitle className="text-base">Our services</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2 md:grid-cols-4">
                  <Input placeholder="Service name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  <Input placeholder="Typical price (optional)" value={form.typical_price} onChange={(e) => setForm({ ...form, typical_price: e.target.value })} />
                  <Input placeholder="Languages, e.g. DE, EN, NL" value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })} />
                  <Button onClick={add}><Plus className="h-4 w-4 mr-1" />Add service</Button>
                  <Textarea className="md:col-span-4" rows={2} placeholder="Short description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                {services.length === 0 && <p className="text-sm text-muted-foreground">No services added yet. Until you add some, the AI uses the services it finds in past orders.</p>}
                {services.map((s) => (
                  <div key={s.id} className="flex flex-wrap items-start justify-between gap-3 border-t pt-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{s.name} {!s.active && <Badge variant="secondary">inactive</Badge>}</p>
                      {s.description && <p className="text-sm text-muted-foreground">{s.description}</p>}
                      <p className="text-xs text-muted-foreground">{[s.typical_price && `Price: ${s.typical_price}`, s.languages && `Languages: ${s.languages}`].filter(Boolean).join(" · ")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Active</span>
                      <Switch checked={s.active} onCheckedChange={(v) => update(s.id, { active: v })} />
                      <Button size="icon" variant="ghost" aria-label={`Delete ${s.name}`} onClick={() => remove(s)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">What clients buy (collected by AI)</CardTitle>
                  <Button variant="outline" onClick={refresh} disabled={refreshing}>
                    {refreshing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}Analyse orders now
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">Updated automatically each month. Hidden services are not used by the AI.</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {insights.length === 0 && <p className="text-sm text-muted-foreground">No analysis yet. Click "Analyse orders now".</p>}
                {insights.map((i) => (
                  <div key={i.id} className={`flex flex-wrap items-start justify-between gap-3 border-t pt-3 ${i.hidden ? "opacity-50" : ""}`}>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Input className="h-8 w-72" value={names[i.id] ?? i.display_name ?? i.service_name}
                          onChange={(e) => setNames({ ...names, [i.id]: e.target.value })}
                          onBlur={() => names[i.id] !== undefined && updateInsight(i.id, { display_name: names[i.id].trim().slice(0, 120) || null })} />
                        {i.confirmed && <Badge>confirmed</Badge>}
                      </div>
                      <p className="text-sm">{i.order_count} orders · {eur(Number(i.revenue))} · {i.revenue_share}% of revenue</p>
                      {i.typical_clients && <p className="text-xs text-muted-foreground">Typical clients: {i.typical_clients}</p>}
                      {i.bought_with && <p className="text-xs text-muted-foreground">Often bought with: {i.bought_with}</p>}
                    </div>
                    <div className="flex gap-2">
                      {!i.confirmed && <Button size="sm" variant="outline" onClick={() => updateInsight(i.id, { confirmed: true })}><Check className="h-4 w-4 mr-1" />Confirm</Button>}
                      <Button size="sm" variant="ghost" onClick={() => updateInsight(i.id, { hidden: !i.hidden })}>
                        {i.hidden ? <><Eye className="h-4 w-4 mr-1" />Show</> : <><EyeOff className="h-4 w-4 mr-1" />Hide</>}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </Layout>
      </div>
    </div>
  );
}
