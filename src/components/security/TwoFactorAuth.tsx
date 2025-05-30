
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Smartphone, Key } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function TwoFactorAuth() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    checkTwoFactorStatus();
  }, []);

  const checkTwoFactorStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('two_factor_enabled')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setIsEnabled(data?.two_factor_enabled || false);
    } catch (error) {
      console.error('Error checking 2FA status:', error);
    }
  };

  const enableTwoFactor = async () => {
    setIsLoading(true);
    try {
      // Generate TOTP secret
      const response = await supabase.functions.invoke('generate-totp-secret', {
        body: { email: user?.email }
      });

      if (response.error) {
        throw response.error;
      }

      setSecret(response.data.secret);
      setQrCode(response.data.qrCode);
      
      toast({
        title: "2FA Setup",
        description: "Scan the QR code with your authenticator app and enter the verification code.",
      });
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      toast({
        variant: "destructive",
        title: "2FA Setup Failed",
        description: "Could not set up two-factor authentication.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!verificationCode) {
      toast({
        variant: "destructive",
        title: "Verification Required",
        description: "Please enter the verification code from your authenticator app.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('verify-totp', {
        body: { 
          secret, 
          token: verificationCode,
          userId: user?.id 
        }
      });

      if (response.error) {
        throw response.error;
      }

      await supabase
        .from('user_settings')
        .upsert({
          id: user?.id,
          two_factor_enabled: true,
          two_factor_secret: secret
        });

      setIsEnabled(true);
      setQrCode("");
      setSecret("");
      setVerificationCode("");

      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication has been successfully enabled.",
      });
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: "Invalid verification code. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const disableTwoFactor = async () => {
    setIsLoading(true);
    try {
      await supabase
        .from('user_settings')
        .update({
          two_factor_enabled: false,
          two_factor_secret: null
        })
        .eq('id', user?.id);

      setIsEnabled(false);

      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled.",
      });
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not disable two-factor authentication.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account with 2FA.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEnabled ? (
          <div className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Two-factor authentication is currently enabled for your account.
              </AlertDescription>
            </Alert>
            <Button 
              variant="destructive" 
              onClick={disableTwoFactor}
              disabled={isLoading}
            >
              Disable 2FA
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {!qrCode ? (
              <div className="space-y-4">
                <Alert>
                  <Smartphone className="h-4 w-4" />
                  <AlertDescription>
                    Install an authenticator app like Google Authenticator, Authy, or 1Password on your phone before enabling 2FA.
                  </AlertDescription>
                </Alert>
                <Button onClick={enableTwoFactor} disabled={isLoading}>
                  <Key className="h-4 w-4 mr-2" />
                  Enable Two-Factor Authentication
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Scan this QR code with your authenticator app:
                  </p>
                  <div className="flex justify-center">
                    <img src={qrCode} alt="2FA QR Code" className="border rounded" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="verification-code">Verification Code</Label>
                  <Input
                    id="verification-code"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    maxLength={6}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={verifyAndEnable} disabled={isLoading}>
                    Verify and Enable
                  </Button>
                  <Button variant="outline" onClick={() => setQrCode("")}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
