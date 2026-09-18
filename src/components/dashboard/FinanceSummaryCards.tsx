import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Euro, AlertTriangle, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getOutstandingAmount } from "@/utils/invoiceBalance";
import { Invoice } from "@/types/invoice";

const formatMoney = (value: number) =>
  `€${value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const FinanceSummaryCards = () => {
  const navigate = useNavigate();
  const [outstanding, setOutstanding] = useState(0);
  const [overdue, setOverdue] = useState(0);
  const [invoicedThisMonth, setInvoicedThisMonth] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select('id, status, total_amount, due_date, issue_date, payments(amount)');

        if (error) throw error;

        const invoices = (data || []) as unknown as Invoice[];
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        let outstandingTotal = 0;
        let overdueTotal = 0;
        let monthTotal = 0;

        for (const invoice of invoices) {
          const remaining = getOutstandingAmount(invoice);
          outstandingTotal += remaining;

          const dueDate = invoice.due_date ? new Date(invoice.due_date) : null;
          if (remaining > 0 && dueDate && dueDate < now) {
            overdueTotal += remaining;
          }

          const issueDate = invoice.issue_date ? new Date(invoice.issue_date) : null;
          if (issueDate && issueDate >= monthStart && invoice.status !== 'cancelled' && invoice.status !== 'draft') {
            monthTotal += Number(invoice.total_amount || 0);
          }
        }

        setOutstanding(outstandingTotal);
        setOverdue(overdueTotal);
        setInvoicedThisMonth(monthTotal);
      } catch (err) {
        console.error('Failed to load finance summary:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const cards = [
    {
      title: "Owed to us",
      value: outstanding,
      icon: <Euro className="h-6 w-6" />,
      colorClass: "text-primary",
      description: "Still unpaid across all invoices",
    },
    {
      title: "Overdue",
      value: overdue,
      icon: <AlertTriangle className="h-6 w-6" />,
      colorClass: "text-destructive",
      description: "Past the due date",
    },
    {
      title: "Invoiced this month",
      value: invoicedThisMonth,
      icon: <TrendingUp className="h-6 w-6" />,
      colorClass: "text-green-600",
      description: "Total value of invoices issued",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {cards.map((card) => (
        <Card
          key={card.title}
          className="border shadow-sm cursor-pointer hover:bg-accent/40 transition-colors"
          onClick={() => navigate('/invoices')}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className={card.colorClass}>{card.icon}</div>
              <div className="text-right">
                <h3 className="font-medium text-lg">{card.title}</h3>
                <div className={`text-2xl font-bold ${card.colorClass}`}>
                  {loading ? '—' : formatMoney(card.value)}
                </div>
                <div className="text-muted-foreground text-xs mt-1">{card.description}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default FinanceSummaryCards;
