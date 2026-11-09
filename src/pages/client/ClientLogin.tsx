import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Building2, Mail } from "lucide-react";
import { logPortalActivity } from "@/services/portalActivity";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getTranslation } from "@/i18n/clientTranslations";
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
  email: z.string().email("login.invalidEmail"),
  password: z.string().min(6, "login.passwordShort"),
});

type LoginLang = "de" | "en";
const LANG_KEY = "client_login_lang";
const initialLang = (): LoginLang => {
  const saved = typeof localStorage !== "undefined" ? localStorage.getItem(LANG_KEY) : null;
  if (saved === "de" || saved === "en") return saved;
  return typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("en") ? "en" : "de";
};

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
  const [lang, setLang] = useState<LoginLang>(initialLang);
  const t = (key: string) => getTranslation(lang, key);
  const chooseLang = (l: LoginLang) => { setLang(l); try { localStorage.setItem(LANG_KEY, l); } catch { /* ignore */ } };

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
          title: t("login.credentialsFailed"),
          description: data.error,
        });
      } else {
        toast({
          title: t("login.credentialsSent"),
          description: t("login.credentialsSentDesc"),
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: err.message || t("login.credentialsError"),
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
        setErrors({ password: t("login.invalidCredentials") });
        window.__lovableEvents?.track?.("project.portal_login_failed", { reason: "wrong_password" });
      } else {
        window.__lovableEvents?.track?.("project.portal_login", { language: lang });
        logPortalActivity("login", { language: lang });
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string } = {};
        err.errors.forEach((error) => {
          const field = error.path[0] as "email" | "password";
          fieldErrors[field] = t(error.message);
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
              {t("login.welcomeTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("login.welcomeDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleRequestCredentials} disabled={requestingCredentials}>
              {requestingCredentials ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("login.sending")}
                </>
              ) : (
                t("login.sendInfo")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-end gap-1" role="group" aria-label="Language / Sprache">
              {(["de", "en"] as const).map((l) => (
                <Button key={l} type="button" size="sm" variant={lang === l ? "secondary" : "ghost"} onClick={() => chooseLang(l)} aria-pressed={lang === l}>
                  {l.toUpperCase()}
                </Button>
              ))}
            </div>
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">{t("login.title")}</CardTitle>
            <CardDescription>
              {t("login.subtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("login.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("login.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t("login.password")}</Label>
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
                    {t("login.signingIn")}
                  </>
                ) : (
                  t("login.signIn")
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>{t("login.needAccess")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ClientLogin;
