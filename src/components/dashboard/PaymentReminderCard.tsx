import { Card, CardContent } from "@/components/ui/card";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { PaymentReminderService } from "@/services/paymentReminderService";
import { useAuth } from "@/context/AuthContext";

interface ReminderStats {
  totalCount: number;
  dueTodayCount: number;
  totalValue: number;
}

export const PaymentReminderCard = () => {
  const [stats, setStats] = useState<ReminderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const data = await PaymentReminderService.getActiveRemindersStats();
        setStats(data);
      } catch (error) {
        console.error("Error fetching reminder stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Listen for order changes to refresh
    const handleOrderChange = () => {
      fetchStats();
    };

    window.addEventListener('orderStatusChanged', handleOrderChange);
    return () => {
      window.removeEventListener('orderStatusChanged', handleOrderChange);
    };
  }, [user]);

  if (!user) return null;

  if (loading) {
    return (
      <Card className="border shadow-sm border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
        <CardContent className="p-6">
          <div className="animate-pulse flex items-center gap-4">
            <div className="h-10 w-10 bg-amber-200 dark:bg-amber-800 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-amber-200 dark:bg-amber-800 rounded w-32 mb-2"></div>
              <div className="h-3 bg-amber-200 dark:bg-amber-800 rounded w-24"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.totalCount === 0) {
    return null; // Don't show card if no active reminders
  }

  return (
    <Card className="border shadow-sm border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-full">
            <Bell className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-amber-800 dark:text-amber-200">
              Payment Reminders
            </h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-amber-700 dark:text-amber-300">
              <span>
                {stats.totalCount} {stats.totalCount === 1 ? 'order' : 'orders'} scheduled
              </span>
              {stats.dueTodayCount > 0 && (
                <span className="font-semibold text-amber-900 dark:text-amber-100 bg-amber-200 dark:bg-amber-800 px-2 py-0.5 rounded-full text-xs">
                  {stats.dueTodayCount} due today
                </span>
              )}
              <span>
                €{stats.totalValue.toFixed(2)} total
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
