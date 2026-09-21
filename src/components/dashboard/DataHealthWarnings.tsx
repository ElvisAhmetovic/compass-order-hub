import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, ChevronRight, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface WarningRecord {
  id: string;
  primary: string;
  secondary?: string;
  meta?: string;
  onClick: () => void;
}

interface WarningItem {
  key: string;
  label: string;
  count: number;
  records: WarningRecord[];
  viewAll: () => void;
}

const MAX_VISIBLE = 10;

const formatMoney = (value?: number | null) => {
  if (value === null || value === undefined) return undefined;
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value);
};

export const DataHealthWarnings = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<WarningItem[]>([]);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [ordersRes, invoicesRes, clientsRes, portalUsersRes] = await Promise.all([
          supabase
            .from('orders')
            .select('id, company_name, description, price', { count: 'exact' })
            .is('client_id', null)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(MAX_VISIBLE + 1),
          supabase
            .from('invoices')
            .select('id, invoice_number, total_amount', { count: 'exact' })
            .is('client_id', null)
            .order('created_at', { ascending: false })
            .limit(MAX_VISIBLE + 1),
          supabase.from('clients').select('id, name, email'),
          supabase.from('app_users').select('email').eq('role', 'client'),
        ]);

        const portalEmails = new Set(
          (portalUsersRes.data || [])
            .map((u: { email: string | null }) => (u.email || '').toLowerCase().trim())
            .filter(Boolean)
        );

        const clientsWithoutPortal = (clientsRes.data || []).filter(
          (c: { email: string | null }) =>
            !c.email || !portalEmails.has(c.email.toLowerCase().trim())
        );

        const next: WarningItem[] = [
          {
            key: 'orders',
            label: 'Orders without a linked client',
            count: ordersRes.count || 0,
            records: (ordersRes.data || []).slice(0, MAX_VISIBLE).map((o: any) => ({
              id: o.id,
              primary: o.company_name || 'Unnamed order',
              secondary: o.description || undefined,
              meta: formatMoney(o.price),
              onClick: () => navigate(`/dashboard?orderId=${o.id}`),
            })),
            viewAll: () => navigate('/dashboard'),
          },
          {
            key: 'invoices',
            label: 'Invoices without a linked client',
            count: invoicesRes.count || 0,
            records: (invoicesRes.data || []).slice(0, MAX_VISIBLE).map((inv: any) => ({
              id: inv.id,
              primary: inv.invoice_number || 'Invoice',
              meta: formatMoney(inv.total_amount),
              onClick: () => navigate(`/invoices/${inv.id}`),
            })),
            viewAll: () => navigate('/invoices'),
          },
          {
            key: 'clients',
            label: 'Clients without a portal login',
            count: clientsWithoutPortal.length,
            records: clientsWithoutPortal.slice(0, MAX_VISIBLE).map((c: any) => ({
              id: c.id,
              primary: c.name || 'Unnamed client',
              secondary: c.email || 'No email',
              onClick: () =>
                navigate(`/clients?q=${encodeURIComponent(c.email || c.name || '')}`),
            })),
            viewAll: () => navigate('/clients'),
          },
        ].filter((item) => item.count > 0);

        setItems(next);
      } catch (err) {
        console.error('Failed to load data health warnings:', err);
      }
    };

    load();
  }, [navigate]);

  if (items.length === 0) return null;

  return (
    <Card className="border shadow-sm mb-6">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3 text-yellow-600">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">Needs attention</span>
        </div>
        <div className="space-y-1">
          {items.map((item) => {
            const expanded = expandedKey === item.key;
            return (
              <div key={item.key}>
                <button
                  type="button"
                  onClick={() => setExpandedKey(expanded ? null : item.key)}
                  aria-expanded={expanded}
                  className="w-full flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-accent/50 transition-colors text-left"
                >
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="flex items-center gap-1 font-medium">
                    {item.count}
                    {expanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </span>
                </button>

                {expanded && (
                  <div className="mt-1 mb-2 ml-2 border-l pl-2 space-y-1">
                    {item.records.map((record) => (
                      <button
                        key={record.id}
                        type="button"
                        onClick={record.onClick}
                        className="w-full flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-accent/50 transition-colors text-left"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{record.primary}</span>
                          {record.secondary && (
                            <span className="block truncate text-xs text-muted-foreground">
                              {record.secondary}
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {record.meta}
                        </span>
                      </button>
                    ))}
                    {item.count > item.records.length && (
                      <button
                        type="button"
                        onClick={item.viewAll}
                        className="w-full text-left rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent/50 transition-colors"
                      >
                        View all {item.count}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default DataHealthWarnings;
