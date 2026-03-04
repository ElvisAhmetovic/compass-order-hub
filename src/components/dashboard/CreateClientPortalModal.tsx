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

function generateSecurePassword(length = 14): string {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%&*";
  const all = upper + lower + numbers + symbols;

  let password = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];

  for (let i = password.length; i < length; i++) {
    password.push(all[Math.floor(Math.random() * all.length)]);
  }

  for (let i = password.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [password[i], password[j]] = [password[j], password[i]];
  }

  return password.join("");
}

export interface PortalEntity {
  id: string;
  name: string;
  contactName: string;
  contactEmail: string;
  clientId?: string | null;
  companyId?: string | null;
  entityType: "order" | "contract";
}

interface CreateClientPortalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: PortalEntity;
  onSuccess: () => void;
}

const CreateClientPortalModal = ({ open, onOpenChange, entity, onSuccess }: CreateClientPortalModalProps) => {
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

  useEffect(() => {
    if (open) {
      setClientName(entity.contactName || entity.name || "");
      setClientEmail(entity.contactEmail || "");
      setPassword(generateSecurePassword());
      setCopied(false);
      setExistingUserId(null);
      setAlreadyLinked(false);
    }
  }, [open, entity]);

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
      if (entity.entityType === "order") {
        setAlreadyLinked(data?.id ? entity.clientId === data.id : false);
      } else {
        // For contracts, "linked" means the account exists
        setAlreadyLinked(!!data?.id);
      }
    } catch {
      setExistingUserId(null);
    } finally {
      setChecking(false);
    }
  }, [entity.clientId, entity.entityType]);

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

  const linkEntityToClient = async (userId: string): Promise<number> => {
    if (entity.entityType === "order") {
      await supabase.from("orders").update({ client_id: userId }).eq("id", entity.id);
      if (entity.companyId) {
        await supabase.from("companies").update({ client_user_id: userId }).eq("id", entity.companyId);
      }
    }

    // Bulk-link all orders with matching contact_email that aren't already linked
    let additionalLinked = 0;
    if (clientEmail) {
      const { data: linkedOrders } = await supabase
        .from("orders")
        .update({ client_id: userId })
        .ilike("contact_email", clientEmail)
        .is("client_id", null)
        .select("id");
      additionalLinked = linkedOrders?.length || 0;
    }

    return additionalLinked;
  };

  const logAction = async (action: string, details: string) => {
    if (!user) return;
    await supabase.from("order_audit_logs").insert({
      order_id: entity.entityType === "order" ? entity.id : null,
      actor_id: user.id,
      action,
      details: entity.entityType === "contract"
        ? `[Contract: ${entity.name}] ${details}`
        : details,
    });
  };

  const handleLinkExisting = async () => {
    if (!existingUserId) return;
    setLoading(true);
    try {
      const additionalLinked = await linkEntityToClient(existingUserId);
      await logAction("client_portal_linked", `Linked existing client portal (${clientEmail}) to ${entity.name}${additionalLinked > 0 ? ` and ${additionalLinked} additional order(s)` : ""}`);
      const extraMsg = additionalLinked > 0 ? ` Also linked ${additionalLinked} additional order(s).` : "";
      toast({ title: "Linked", description: `Linked to existing client portal for ${clientEmail}.${extraMsg}` });
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
      const nameParts = clientName.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const linkOrderId = entity.entityType === "order" ? entity.id : undefined;

      const { data: createData, error: createError } = await supabase.functions.invoke("create-user", {
        body: {
          email: clientEmail.toLowerCase(),
          password,
          firstName,
          lastName,
          role: "client",
          linkOrderId,
        },
      });

      if (createError) throw new Error(createError.message || "Failed to create user");
      if (createData?.error) throw new Error(createData.error);

      const newUserId = createData?.user_id;
      let additionalLinked = 0;
      if (newUserId) {
        additionalLinked = await linkEntityToClient(newUserId);
      }

      const portalUrl = `${window.location.origin}/client/login`;
      await supabase.functions.invoke("send-client-portal-credentials", {
        body: {
          clientEmail: clientEmail.toLowerCase(),
          clientName,
          password,
          portalUrl,
          companyName: entity.name,
          senderName: user?.full_name || user?.email || "Admin",
          senderId: user?.id,
          orderId: entity.entityType === "order" ? entity.id : null,
        },
      });

      const extraMsg = additionalLinked > 0 ? ` Also linked ${additionalLinked} additional order(s).` : "";
      await logAction("client_portal_created", `Created client portal for ${clientEmail} and sent credentials${additionalLinked > 0 ? ` (${additionalLinked} additional orders auto-linked)` : ""}`);

      toast({
        title: "Client portal created",
        description: `Account created and credentials sent to ${clientEmail}.${extraMsg}`,
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
          companyName: entity.name,
          senderName: user?.full_name || user?.email || "Admin",
          senderId: user?.id,
          orderId: entity.entityType === "order" ? entity.id : null,
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

  const showLinkButton = entity.entityType === "order" && existingUserId && !alreadyLinked;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Client Portal
          </DialogTitle>
          <DialogDescription>
            {entity.entityType === "contract"
              ? "Create or manage a client portal account for this contract."
              : "Create or link a client portal account for this order."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
                  ? entity.entityType === "contract"
                    ? "Client portal already exists for this email."
                    : "Client portal already exists and is linked to this order."
                  : "A client portal already exists for this email."}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="portal-name">Full Name</Label>
            <Input
              id="portal-name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              disabled={!!existingUserId}
            />
          </div>

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
              {showLinkButton && (
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
