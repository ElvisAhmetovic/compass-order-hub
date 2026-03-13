import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Building2, Mail } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const ClientLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCredentialDialog, setShowCredentialDialog] = useState(false);
  const [requestingCredentials, setRequestingCredentials] = useState(false);
  const [credentialOrderId, setCredentialOrderId] = useState<string | null>(null);
  const { login, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/client/dashboard";

  // Check for requestCredentials query param
  useEffect(() => {
    const orderId = searchParams.get('requestCredentials');
    if (orderId && orderId.length > 0) {
      setCredentialOrderId(orderId);
      setShowCredentialDialog(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      if (user.role === "client") {
        navigate(from, { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, navigate, from]);

  const handleRequestCredentials = async () => {
    if (!credentialOrderId) return;
    setRequestingCredentials(true);
    try {
      const { data, error } = await supabase.functions.invoke('request-client-credentials', {
        body: { orderId: credentialOrderId },
      });

      if (error) throw error;
      if (data?.error) {
        toast({
          variant: "destructive",
          title: "Could not send credentials",
          description: data.error,
        });
      } else {
        toast({
          title: "Credentials sent!",
          description: "Check your email for your login details. You can then sign in below.",
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to request credentials. Please try again.",
      });
    } finally {
      setRequestingCredentials(false);
      setShowCredentialDialog(false);
      // Clear the query param
      setSearchParams({}, { replace: true });
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validated = loginSchema.parse({ email, password });
      setIsSubmitting(true);

      const success = await login(validated.email, validated.password);
      
      if (!success) {
        setErrors({ password: "Invalid email or password" });
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string } = {};
        err.errors.forEach((error) => {
          const field = error.path[0] as "email" | "password";
          fieldErrors[field] = error.message;
        });
        setErrors(fieldErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <AlertDialog open={showCredentialDialog} onOpenChange={(open) => { if (!open) { setShowCredentialDialog(false); setSearchParams({}, { replace: true }); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Welcome to the Client Portal
            </AlertDialogTitle>
            <AlertDialogDescription>
              Would you like us to send your login credentials to your email address? 
              You'll receive your email and password to access your portal where you can track orders, view invoices, and more.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDismissCredentialDialog} disabled={requestingCredentials}>
              No thanks
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRequestCredentials} disabled={requestingCredentials}>
              {requestingCredentials ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send My Login Info"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Client Portal</CardTitle>
            <CardDescription>
              Sign in to view your orders and invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>Need access? Contact your account manager.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ClientLogin;
