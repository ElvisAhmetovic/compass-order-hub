import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface WarningItem {
  key: string;
  label: string;
  count: number;
  onClick: () => void;
}

export const DataHealthWarnings = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<WarningItem[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [ordersRes, invoicesRes, clientsRes, portalUsersRes] = await Promise.all([
          supabase
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .is('client_id', null)
            .is('deleted_at', null),
          supabase
            .from('invoices')
            .select('id', { count: 'exact', head: true })
            .is('client_id', null),
          supabase.from('clients').select('id, email'),
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
        ).length;

        const next: WarningItem[] = [
          {
            key: 'orders',
            label: 'Orders without a linked client',
            count: ordersRes.count || 0,
            onClick: () => navigate('/dashboard'),
          },
          {
            key: 'invoices',
            label: 'Invoices without a linked client',
            count: invoicesRes.count || 0,
            onClick: () => navigate('/invoices'),
          },
          {
            key: 'clients',
            label: 'Clients without a portal login',
            count: clientsWithoutPortal,
            onClick: () => navigate('/clients'),
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
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={item.onClick}
              className="w-full flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-accent/50 transition-colors text-left"
            >
              <span className="text-muted-foreground">{item.label}</span>
              <span className="flex items-center gap-1 font-medium">
                {item.count}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DataHealthWarnings;
