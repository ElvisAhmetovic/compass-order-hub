import { supabase } from "@/integrations/supabase/client";

export type InvoiceAuditOutcome =
  | "success"
  | "conflict_409"
  | "validation_error"
  | "permission_denied"
  | "unknown_error";

export type InvoiceAuditSource =
  | "manual_invoice_page"
  | "order_actions_button"
  | "order_status_toggle"
  | "bulk_sync";

export interface InvoiceAuditPayload {
  outcome: InvoiceAuditOutcome;
  source: InvoiceAuditSource;
  actor_user_id?: string | null;
  actor_email?: string | null;
  actor_name?: string | null;
  actor_role?: string | null;
  order_id?: string | null;
  order_company_name?: string | null;
  order_contact_email?: string | null;
  order_price?: number | null;
  order_currency?: string | null;
  client_id?: string | null;
  client_name?: string | null;
  invoice_id?: string | null;
  invoice_number?: string | null;
  error_code?: string | null;
  error_message?: string | null;
  attempt_number?: number;
  metadata?: Record<string, any> | null;
}

export interface InvoiceAuditLog extends InvoiceAuditPayload {
  id: string;
  created_at: string;
}

function extractErrorCode(error: any): string | null {
  if (!error) return null;
  if (error.code) return String(error.code);
  const message = String(error?.message || "");
  if (message.includes("409")) return "409";
  return null;
}

function extractErrorMessage(error: any): string | null {
  if (!error) return null;
  if (typeof error === "string") return error.slice(0, 1000);
  return String(error?.message || error?.details || error?.hint || JSON.stringify(error)).slice(0, 1000);
}

export function classifyError(error: any): InvoiceAuditOutcome {
  if (!error) return "unknown_error";
  const code = extractErrorCode(error);
  const message = String(error?.message || "").toLowerCase();
  if (code === "23505" || code === "409" || message.includes("already exists") || message.includes("duplicate")) {
    return "conflict_409";
  }
  if (code === "42501" || message.includes("permission") || message.includes("rls") || message.includes("not authorized")) {
    return "permission_denied";
  }
  if (code?.startsWith("23") || message.includes("validation") || message.includes("invalid")) {
    return "validation_error";
  }
  return "unknown_error";
}

export class InvoiceAuditService {
  static async log(payload: InvoiceAuditPayload): Promise<void> {
    try {
      // Auto-fill actor if not provided
      if (!payload.actor_user_id) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          payload.actor_user_id = user.id;
          payload.actor_email = payload.actor_email ?? user.email ?? null;
          payload.actor_name = payload.actor_name
            ?? (user.user_metadata?.full_name as string | undefined)
            ?? (user.user_metadata?.first_name as string | undefined)
            ?? null;
          payload.actor_role = payload.actor_role
            ?? (user.user_metadata?.role as string | undefined)
            ?? null;
        }
      }

      const row = {
        outcome: payload.outcome,
        source: payload.source,
        actor_user_id: payload.actor_user_id ?? null,
        actor_email: payload.actor_email ?? null,
        actor_name: payload.actor_name ?? null,
        actor_role: payload.actor_role ?? null,
        order_id: payload.order_id ?? null,
        order_company_name: payload.order_company_name ?? null,
        order_contact_email: payload.order_contact_email ?? null,
        order_price: payload.order_price ?? null,
        order_currency: payload.order_currency ?? null,
        client_id: payload.client_id ?? null,
        client_name: payload.client_name ?? null,
        invoice_id: payload.invoice_id ?? null,
        invoice_number: payload.invoice_number ?? null,
        error_code: payload.error_code ?? null,
        error_message: payload.error_message ?? null,
        attempt_number: payload.attempt_number ?? 1,
        metadata: {
          ...(payload.metadata || {}),
          user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        },
      };

      const { error } = await supabase.from("invoice_audit_logs" as any).insert(row);
      if (error) console.warn("[InvoiceAudit] failed to log:", error);
    } catch (err) {
      // Never throw from audit
      console.warn("[InvoiceAudit] exception while logging:", err);
    }
  }

  static async logError(
    error: any,
    base: Omit<InvoiceAuditPayload, "outcome" | "error_code" | "error_message">
  ): Promise<void> {
    return this.log({
      ...base,
      outcome: classifyError(error),
      error_code: extractErrorCode(error),
      error_message: extractErrorMessage(error),
    });
  }

  static async list(filters: {
    outcome?: InvoiceAuditOutcome | "all";
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ rows: InvoiceAuditLog[]; count: number }> {
    const limit = filters.limit ?? 100;
    const offset = filters.offset ?? 0;

    let query = supabase
      .from("invoice_audit_logs" as any)
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters.outcome && filters.outcome !== "all") {
      query = query.eq("outcome", filters.outcome);
    }
    if (filters.search && filters.search.trim()) {
      const s = `%${filters.search.trim()}%`;
      query = query.or(
        `invoice_number.ilike.${s},order_company_name.ilike.${s},order_contact_email.ilike.${s},actor_email.ilike.${s},actor_name.ilike.${s},client_name.ilike.${s},error_message.ilike.${s}`
      );
    }

    const { data, error, count } = await query;
    if (error) throw error;
    return { rows: (data as any as InvoiceAuditLog[]) || [], count: count || 0 };
  }
}
