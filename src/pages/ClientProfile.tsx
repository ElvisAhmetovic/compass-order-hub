import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/dashboard/Sidebar";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Phone, MapPin, User } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const fmt = (d: string | null) => d ? new Date(d).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" }) : "";
const UUID = /^[0-9a-f-]{36}$/i;

export default function ClientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const valid = !!id && UUID.test(id);

  const client = useQuery({
    queryKey: ["client-profile", id], enabled: valid,
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const email = client.data?.email?.trim() ?? "";

  const related = useQuery({
    queryKey: ["client-related", id, email], enabled: !!email,
    queryFn: async () => {
      const [o, t, r] = await Promise.all([
        supabase.from("orders").select("id, company_name, description, status, created_at").ilike("contact_email", email).is("deleted_at", null).order("created_at", { ascending: false }).limit(50),
        supabase.from("customer_tickets").select("id, subject, status, created_at").or(`client_email.ilike.${email.replace(/[,()]/g, "")},assigned_client_id.eq.${id}`).order("created_at", { ascending: false }).limit(50),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from("outreach_replies").select("id, subject, received_at").ilike("from_email", email).order("received_at", { ascending: false }).limit(50),
      ]);
      for (const x of [o, t, r]) if (x.error) throw x.error;
      return { orders: o.data ?? [], tickets: t.data ?? [], replies: (r.data ?? []) as { id: string; subject: string | null; received_at: string }[] };
    },
  });

  const [notes, setNotes] = useState("");
  useEffect(() => { setNotes(client.data?.notes ?? ""); }, [client.data?.notes]);
  const editor = useQuery({
    queryKey: ["profile-name", client.data?.notes_updated_by], enabled: !!client.data?.notes_updated_by,
    queryFn: async () => (await supabase.from("profiles").select("full_name, email").eq("id", client.data!.notes_updated_by!).maybeSingle()).data,
  });

  const save = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const { data, error } = await supabase.from("clients").update({ notes, notes_updated_at: new Date().toISOString(), notes_updated_by: auth.user?.id ?? null }).eq("id", id!).select("id");
      if (error) throw error;
      if (!data?.length) throw new Error("Not allowed to edit this client.");
    },
    onSuccess: () => { toast({ title: "Notes saved" }); qc.invalidateQueries({ queryKey: ["client-profile", id] }); qc.invalidateQueries({ queryKey: ["clients-by-email"] }); },
    onError: (e: Error) => toast({ title: "Could not save notes", description: e.message, variant: "destructive" }),
  });

  const shell = (body: React.ReactNode) => (
    <div className="flex min-h-screen"><Sidebar /><div className="flex-1 flex flex-col p-6 space-y-4 max-w-5xl">
      <div><Button variant="ghost" size="sm" onClick={() => navigate("/clients")}><ArrowLeft className="mr-2 h-4 w-4" />Clients</Button></div>{body}</div></div>
  );

  if (!valid) return shell(<p className="text-muted-foreground">Client not found.</p>);
  if (client.isLoading) return shell(<p className="text-muted-foreground">Loading…</p>);
  if (client.error) return shell(<Card><CardContent className="pt-6 flex items-center gap-3"><span>Could not load this client.</span><Button size="sm" onClick={() => client.refetch()}>Retry</Button></CardContent></Card>);
  const c = client.data;
  if (!c) return shell(<p className="text-muted-foreground">Client not found.</p>);

  return shell(<>
    <Card>
      <CardHeader><CardTitle className="text-2xl">{c.name}</CardTitle></CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2 text-sm">
        <p className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" />{c.contact_person || "—"}</p>
        <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><a className="underline" href={`mailto:${c.email}`}>{c.email}</a></p>
        <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{c.phone ? <a className="underline" href={`tel:${c.phone}`}>{c.phone}</a> : "—"}</p>
        <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" />{[c.address, c.zip_code, c.city, c.country].filter(Boolean).join(", ") || "—"}</p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        <Textarea aria-label="Client notes" rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={10000} placeholder="Internal team notes about this client" />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{c.notes_updated_at ? `Last edited${editor.data ? ` by ${editor.data.full_name || editor.data.email}` : ""} on ${fmt(c.notes_updated_at)}` : "No notes yet"}</p>
          <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending || notes === (c.notes ?? "")}>{save.isPending ? "Saving…" : "Save notes"}</Button>
        </div>
      </CardContent>
    </Card>

    {related.error ? <Card><CardContent className="pt-6 flex items-center gap-3"><span>Could not load orders, tickets and replies.</span><Button size="sm" onClick={() => related.refetch()}>Retry</Button></CardContent></Card> : (
      <div className="grid gap-4 lg:grid-cols-3">
        <Card><CardHeader><CardTitle className="text-base">Orders ({related.data?.orders.length ?? "…"})</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">{related.data?.orders.map((o) => (
            <div key={o.id} className="border-b border-border pb-2"><p className="font-medium">{o.description || o.company_name}</p>
              <p className="text-xs text-muted-foreground">{fmt(o.created_at)} · <Badge variant="outline">{o.status}</Badge></p></div>))}
            {related.data && !related.data.orders.length && <p className="text-muted-foreground">No orders.</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Tickets ({related.data?.tickets.length ?? "…"})</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">{related.data?.tickets.map((t) => (
            <button key={t.id} className="block w-full text-left border-b border-border pb-2 hover:text-primary" onClick={() => navigate(`/customer-tickets/${t.id}`)}>
              <p className="font-medium">{t.subject}</p><p className="text-xs text-muted-foreground">{fmt(t.created_at)} · {t.status}</p></button>))}
            {related.data && !related.data.tickets.length && <p className="text-muted-foreground">No tickets.</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Outreach replies ({related.data?.replies.length ?? "…"})</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">{related.data?.replies.map((r) => (
            <button key={r.id} className="block w-full text-left border-b border-border pb-2 hover:text-primary" onClick={() => navigate("/ai-outreach")}>
              <p className="font-medium">{r.subject || "(no subject)"}</p><p className="text-xs text-muted-foreground">{fmt(r.received_at)}</p></button>))}
            {related.data && !related.data.replies.length && <p className="text-muted-foreground">No replies.</p>}</CardContent></Card>
      </div>)}
  </>);
}
