
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Download, Trash2, Eye } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

export function GDPRCompliance() {
  const [isLoading, setIsLoading] = useState(false);
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const exportUserData = async () => {
    setIsLoading(true);
    try {
      // Get session token for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await supabase.functions.invoke('export-user-data', {
        body: { userId: user?.id },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        throw response.error;
      }

      // Create and download the data export
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Data Exported",
        description: "Your personal data has been exported and downloaded.",
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Could not export your data. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUserData = async () => {
    setIsLoading(true);
    try {
      // Get session token for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await supabase.functions.invoke('delete-user-data', {
        body: { userId: user?.id },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        throw response.error;
      }

      toast({
        title: "Account Deleted",
        description: "Your account and all associated data have been permanently deleted.",
      });

      // Sign out the user after deletion
      setTimeout(() => {
        logout();
      }, 2000);

    } catch (error) {
      console.error('Error deleting data:', error);
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: "Could not delete your data. Please contact support.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const viewDataProcessing = async () => {
    try {
      // Get session token for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await supabase.functions.invoke('get-data-processing-info', {
        body: { userId: user?.id },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        throw response.error;
      }

      // Create and download the processing info
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `data-processing-info-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Processing Info Downloaded",
        description: "Information about how your data is processed has been downloaded.",
      });
    } catch (error) {
      console.error('Error getting processing info:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not retrieve data processing information.",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          GDPR Compliance
        </CardTitle>
        <CardDescription>
          Manage your personal data and privacy rights under GDPR.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            You have the right to access, rectify, erase, and port your personal data under GDPR.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">Export Personal Data</p>
              <p className="text-sm text-muted-foreground">
                Download all your personal data in JSON format
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={exportUserData}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">Data Processing Information</p>
              <p className="text-sm text-muted-foreground">
                View how your data is processed and stored
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={viewDataProcessing}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              View
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg border-destructive/20">
            <div>
              <p className="font-medium text-destructive">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Account</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account
                    and remove all your data from our servers, including:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Profile information</li>
                      <li>Order history</li>
                      <li>Client data</li>
                      <li>Messages and files</li>
                      <li>All other associated data</li>
                    </ul>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={deleteUserData}
                    disabled={isLoading}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {isLoading ? "Deleting..." : "Delete Account"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
