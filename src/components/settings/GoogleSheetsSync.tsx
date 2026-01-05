import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { OrderService } from "@/services/orderService";
import { RefreshCw, CheckCircle, AlertCircle, FileSpreadsheet } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function GoogleSheetsSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; count: number } | null>(null);
  const { toast } = useToast();

  const handleSyncAllOrders = async () => {
    setIsSyncing(true);
    setSyncResult(null);

    try {
      // Fetch all orders including yearly packages
      const allOrders = await OrderService.getOrders(true, false);
      
      if (allOrders.length === 0) {
        toast({
          title: "No orders to sync",
          description: "There are no orders in the database.",
          variant: "default",
        });
        setIsSyncing(false);
        return;
      }

      console.log(`Syncing ${allOrders.length} orders to Google Sheets...`);

      // Send batch to edge function
      const { data, error } = await supabase.functions.invoke('sync-order-to-sheets', {
        body: { ordersData: allOrders, syncType: 'bulk_sync' }
      });

      if (error) {
        throw error;
      }

      setSyncResult({ success: true, count: allOrders.length });
      toast({
        title: "Sync Complete",
        description: `Successfully synced ${allOrders.length} orders to Google Sheets.`,
      });
    } catch (error) {
      console.error('Failed to sync orders:', error);
      setSyncResult({ success: false, count: 0 });
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync orders to Google Sheets.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <FileSpreadsheet className="h-5 w-5 text-green-600" />
        <div>
          <h4 className="font-medium">Google Sheets Sync</h4>
          <p className="text-sm text-muted-foreground">
            Sync all orders to your connected Google Sheet. New orders and updates are synced automatically.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" disabled={isSyncing}>
              {isSyncing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync All Orders
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sync All Orders to Google Sheets?</AlertDialogTitle>
              <AlertDialogDescription>
                This will add all existing orders (including yearly packages) as new rows in your Google Sheet.
                This action may create duplicate entries if orders have been synced before.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSyncAllOrders}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {syncResult && (
          <div className="flex items-center gap-2 text-sm">
            {syncResult.success ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-green-600">{syncResult.count} orders synced</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-destructive">Sync failed</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
