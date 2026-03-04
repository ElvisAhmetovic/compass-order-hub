import { useState, useEffect, useCallback } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, UserCheck, AlertCircle, Loader2, KeyRound, Link2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Order } from "@/types";

function generateSecurePassword(length = 14): string {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%&*";
  const all = upper + lower + numbers + symbols;

  // Ensure at least one of each category
  let password = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];

  for (let i = password.length; i < length; i++) {
    password.push(all[Math.floor(Math.random() * all.length)]);
  }

  // Shuffle
  for (let i = password.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [password[i], password[j]] = [password[j], password[i]];
  }

  return password.join("");
}

interface CreateClientPortalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  onSuccess: () => void;
}

const CreateClientPortalModal = ({ open, onOpenChange, order, onSuccess }: CreateClientPortalModalProps) => {
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [existingUserId, setExistingUserId] = useState<string | null>(null);
  const [alreadyLinked, setAlreadyLinked] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();

  // Initialize fields when modal opens
  useEffect(() => {
    if (open) {
      setClientName(order.contact_name || order.company_name || "");
      setClientEmail(order.contact_email || "");
      setPassword(generateSecurePassword());
      setCopied(false);
      setExistingUserId(null);
      setAlreadyLinked(false);
    }
  }, [open, order]);

  // Check for existing account when email changes
  const checkExistingAccount = useCallback(async (email: string) => {
    if (!email || email.length < 3) {
      setExistingUserId(null);
      return;
    }
    setChecking(true);
    try {
      const { data } = await supabase
        .from("app_users")
        .select("id")
        .eq("email", email.toLowerCase())
        .eq("role", "client")
        .maybeSingle();

      setExistingUserId(data?.id || null);
      setAlreadyLinked(data?.id ? order.client_id === data.id : false);
    } catch {
      setExistingUserId(null);
    } finally {
      setChecking(false);
    }
  }, [order.client_id]);

  useEffect(() => {
    if (open && clientEmail) {
      const timeout = setTimeout(() => checkExistingAccount(clientEmail), 300);
      return () => clearTimeout(timeout);
    }
  }, [open, clientEmail, checkExistingAccount]);

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const linkOrderToClient = async (userId: string) => {
    await supabase.from("orders").update({ client_id: userId }).eq("id", order.id);
    // Also link via company if applicable
    if (order.company_id) {
      await supabase.from("companies").update({ client_user_id: userId }).eq("id", order.company_id);
    }
  };

  const logAction = async (action: string, details: string) => {
    if (!user) return;
    await supabase.from("order_audit_logs").insert({
      order_id: order.id,
      actor_id: user.id,
      action,
      details,
    });
  };

  const handleLinkExisting = async () => {
    if (!existingUserId) return;
    setLoading(true);
    try {
      await linkOrderToClient(existingUserId);
      await logAction("client_portal_linked", `Linked existing client portal (${clientEmail}) to order ${order.company_name}`);
      toast({ title: "Order linked", description: `Order linked to existing client portal for ${clientEmail}.` });
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndInvite = async () => {
    if (!clientEmail || !clientName) {
      toast({ title: "Missing fields", description: "Name and email are required.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      // Split name into first/last
      const nameParts = clientName.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      // Create user via edge function
      const { data: createData, error: createError } = await supabase.functions.invoke("create-user", {
        body: {
          email: clientEmail.toLowerCase(),
          password,
          firstName,
          lastName,
          role: "client",
          linkOrderId: order.id,
        },
      });

      if (createError) throw new Error(createError.message || "Failed to create user");
      if (createData?.error) throw new Error(createData.error);

      const newUserId = createData?.user_id;
      if (newUserId) {
        await linkOrderToClient(newUserId);
      }

      // Send credentials email
      const portalUrl = `${window.location.origin}/client/login`;
      await supabase.functions.invoke("send-client-portal-credentials", {
        body: {
          clientEmail: clientEmail.toLowerCase(),
          clientName,
          password,
          portalUrl,
          companyName: order.company_name,
          senderName: user?.full_name || user?.email || "Admin",
          senderId: user?.id,
          orderId: order.id,
        },
      });

      await logAction("client_portal_created", `Created client portal for ${clientEmail} and sent credentials`);

      toast({
        title: "Client portal created",
        description: `Account created and credentials sent to ${clientEmail}.`,
      });
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Error creating client portal:", err);
      toast({ title: "Error", description: err.message || "Failed to create client portal", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCredentials = async () => {
    setLoading(true);
    try {
      const newPass = generateSecurePassword();
      setPassword(newPass);

      const portalUrl = `${window.location.origin}/client/login`;
      await supabase.functions.invoke("send-client-portal-credentials", {
        body: {
          clientEmail: clientEmail.toLowerCase(),
          clientName,
          password: newPass,
          portalUrl,
          companyName: order.company_name,
          senderName: user?.full_name || user?.email || "Admin",
          senderId: user?.id,
          orderId: order.id,
          isResend: true,
        },
      });

      await logAction("client_portal_credentials_resent", `Re-sent portal credentials to ${clientEmail}`);
      toast({ title: "Credentials sent", description: `New credentials sent to ${clientEmail}.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Client Portal
          </DialogTitle>
          <DialogDescription>
            Create or link a client portal account for this order.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Duplicate detection banner */}
          {checking && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Checking for existing account...
            </div>
          )}

          {existingUserId && !checking && (
            <Alert className={alreadyLinked ? "border-green-500 bg-green-500/10" : "border-blue-500 bg-blue-500/10"}>
              <UserCheck className="h-4 w-4" />
              <AlertDescription>
                {alreadyLinked
                  ? "Client portal already exists and is linked to this order."
                  : "A client portal already exists for this email."}
              </AlertDescription>
            </Alert>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="portal-name">Full Name</Label>
            <Input
              id="portal-name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              disabled={!!existingUserId}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="portal-email">Email</Label>
            <Input
              id="portal-email"
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              disabled={!!existingUserId}
            />
          </div>

          {/* Password - only show for new accounts */}
          {!existingUserId && !checking && (
            <div className="space-y-2">
              <Label htmlFor="portal-password">Generated Password</Label>
              <div className="flex gap-2">
                <Input id="portal-password" value={password} readOnly className="font-mono text-sm" />
                <Button variant="outline" size="icon" onClick={handleCopyPassword}>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="icon" onClick={() => setPassword(generateSecurePassword())}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This password will be sent to the client along with login instructions.
              </p>
            </div>
          )}

          {/* Role badge */}
          <div className="flex items-center gap-2">
            <Label>Role</Label>
            <Badge variant="secondary">Client</Badge>
          </div>

          {!existingUserId && !checking && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              This will create a client portal account and send credentials via email.
            </p>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          {existingUserId ? (
            <>
              {!alreadyLinked && (
                <Button onClick={handleLinkExisting} disabled={loading} className="w-full sm:w-auto">
                  {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Link2 className="h-4 w-4 mr-1" />}
                  Link to This Order
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleResendCredentials}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                Re-send Credentials
              </Button>
            </>
          ) : (
            <Button onClick={handleCreateAndInvite} disabled={loading || checking || !clientEmail} className="w-full sm:w-auto">
              {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <KeyRound className="h-4 w-4 mr-1" />}
              Create & Send Invite
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateClientPortalModal;
