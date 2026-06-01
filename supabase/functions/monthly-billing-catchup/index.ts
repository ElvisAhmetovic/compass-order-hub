import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const today = new Date().toISOString().split("T")[0];

    // Find missed installments: either no email sent yet, OR email sent but invoice never linked (orphans)
    const { data: missed, error } = await supabase
      .from("monthly_installments")
      .select("id, contract_id, client_name, month_label, email_sent, invoice_id")
      .lte("due_date", today)
      .eq("payment_status", "unpaid")
      .or("email_sent.eq.false,invoice_id.is.null");

    if (error) throw error;

    // Also find active contracts that have NO installment for current month yet
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const { data: activeContracts } = await supabase
      .from("monthly_contracts")
      .select("id, client_name")
      .eq("status", "active");

    const contractsToRetrigger = new Set<string>();
    const orphanInstallmentIds: string[] = [];
    for (const m of missed || []) {
      if (m.contract_id) contractsToRetrigger.add(m.contract_id);
      // Orphan: email_sent=true but invoice_id=null — reset so the generator picks it up
      if (m.email_sent === true && !m.invoice_id) orphanInstallmentIds.push(m.id);
    }
    for (const c of activeContracts || []) {
      const { data: instThisMonth } = await supabase
        .from("monthly_installments")
        .select("id")
        .eq("contract_id", c.id)
        .gte("due_date", monthStart)
        .maybeSingle();
      if (!instThisMonth) contractsToRetrigger.add(c.id);
    }

    // Reset orphan rows so the generator will recreate the invoice and resend the email
    if (orphanInstallmentIds.length > 0) {
      await supabase
        .from("monthly_installments")
        .update({ email_sent: false, email_sent_at: null })
        .in("id", orphanInstallmentIds);
      console.log(`Reset ${orphanInstallmentIds.length} orphan installments (email_sent=true, invoice_id=null)`);
    }

    console.log(`Catch-up: re-triggering ${contractsToRetrigger.size} contracts`);

    // Fan out one short-lived invocation per contract. Each invocation paces
    // its own Resend sends internally; we additionally stagger the kick-offs
    // by 3 s so even a large catchup never bursts past Resend's 2 req/sec
    // account ceiling end-to-end.
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const STAGGER_MS = 3000;
    const results: any[] = [];
    let i = 0;
    for (const contractId of contractsToRetrigger) {
      try {
        fetch(
          `${supabaseUrl}/functions/v1/generate-monthly-installments?contract_id=${contractId}&trigger=catchup`,
          { method: "POST", headers: { Authorization: `Bearer ${serviceRoleKey}` } },
        ).catch((e) => console.error(`Fire-and-forget trigger failed for ${contractId}:`, e));
        results.push({ contractId, queued: true });
      } catch (e) {
        results.push({ contractId, error: String(e) });
      }
      i++;
      if (i < contractsToRetrigger.size) await sleep(STAGGER_MS);
    }

    return new Response(
      JSON.stringify({ success: true, retriggered: contractsToRetrigger.size, orphans_reset: orphanInstallmentIds.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("Catch-up error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
