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

    // Find unpaid installments past due that never got an email sent
    const { data: missed, error } = await supabase
      .from("monthly_installments")
      .select("id, contract_id, client_name, month_label")
      .lte("due_date", today)
      .eq("email_sent", false)
      .eq("payment_status", "unpaid");

    if (error) throw error;

    // Also find active contracts that have NO installment for current month yet
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const { data: activeContracts } = await supabase
      .from("monthly_contracts")
      .select("id, client_name")
      .eq("status", "active");

    const contractsToRetrigger = new Set<string>();
    for (const m of missed || []) {
      if (m.contract_id) contractsToRetrigger.add(m.contract_id);
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

    console.log(`Catch-up: re-triggering ${contractsToRetrigger.size} contracts`);

    const results: any[] = [];
    for (const contractId of contractsToRetrigger) {
      try {
        const res = await fetch(
          `${supabaseUrl}/functions/v1/generate-monthly-installments?contract_id=${contractId}&trigger=catchup`,
          { method: "POST", headers: { Authorization: `Bearer ${serviceRoleKey}` } },
        );
        results.push({ contractId, status: res.status });
        // Small delay between triggers
        await new Promise((r) => setTimeout(r, 500));
      } catch (e) {
        results.push({ contractId, error: String(e) });
      }
    }

    return new Response(
      JSON.stringify({ success: true, retriggered: contractsToRetrigger.size, results }),
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
