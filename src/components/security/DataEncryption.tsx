
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Shield, Download } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function DataEncryption() {
  const [encryptionEnabled, setEncryptionEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    checkEncryptionStatus();
  }, []);

  const checkEncryptionStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('data_encryption_enabled')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setEncryptionEnabled(data?.data_encryption_enabled || false);
    } catch (error) {
      console.error('Error checking encryption status:', error);
    }
  };

  const toggleEncryption = async () => {
    setIsLoading(true);
    try {
      const newStatus = !encryptionEnabled;
      
      await supabase
        .from('user_settings')
        .upsert({
          id: user?.id,
          data_encryption_enabled: newStatus
        });

      setEncryptionEnabled(newStatus);

      toast({
        title: newStatus ? "Encryption Enabled" : "Encryption Disabled",
        description: newStatus 
          ? "Your sensitive data will now be encrypted."
          : "Data encryption has been disabled.",
      });
    } catch (error) {
      console.error('Error toggling encryption:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not update encryption settings.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateEncryptionReport = async () => {
    try {
      // Get session token for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await supabase.functions.invoke('generate-encryption-report', {
        body: { userId: user?.id },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        throw response.error;
      }

      // Create and download the report
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `encryption-report-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Report Generated",
        description: "Encryption report has been downloaded.",
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not generate encryption report.",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Data Encryption
        </CardTitle>
        <CardDescription>
          Encrypt sensitive client data for enhanced security.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            {encryptionEnabled 
              ? "Your sensitive data is currently encrypted using AES-256 encryption."
              : "Enable encryption to protect sensitive client data, orders, and financial information."
            }
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Client Data Encryption</p>
              <p className="text-sm text-muted-foreground">
                Encrypt client information, order details, and financial data
              </p>
            </div>
            <Button 
              variant={encryptionEnabled ? "destructive" : "default"}
              onClick={toggleEncryption}
              disabled={isLoading}
            >
              {encryptionEnabled ? "Disable" : "Enable"} Encryption
            </Button>
          </div>

          {encryptionEnabled && (
            <div className="pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={generateEncryptionReport}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Encryption Report
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
