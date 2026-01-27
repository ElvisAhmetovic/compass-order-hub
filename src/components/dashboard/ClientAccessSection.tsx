import { useState, useEffect } from "react";
import { Shield, UserPlus, Mail, UserX, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import {
  getClientUsers,
  getClientById,
  linkClientToOrder,
  unlinkClientFromOrder,
  logInviteSent,
  ClientUser,
} from "@/services/clientAccessService";

interface ClientAccessSectionProps {
  orderId: string;
  currentClientId: string | null;
  onClientLinked: () => void;
}

const ClientAccessSection = ({
  orderId,
  currentClientId,
  onClientLinked,
}: ClientAccessSectionProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientUser[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [currentClient, setCurrentClient] = useState<ClientUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLinking, setIsLinking] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (currentClientId) {
      loadCurrentClient(currentClientId);
    } else {
      setCurrentClient(null);
    }
  }, [currentClientId]);

  const loadClients = async () => {
    setIsLoading(true);
    const clientList = await getClientUsers();
    setClients(clientList);
    setIsLoading(false);
  };

  const loadCurrentClient = async (clientId: string) => {
    const client = await getClientById(clientId);
    setCurrentClient(client);
  };

  const handleLinkClient = async () => {
    if (!selectedClientId || !user?.id) return;

    setIsLinking(true);
    const result = await linkClientToOrder(orderId, selectedClientId, user.id);

    if (result.success) {
      toast({
        title: "Client Linked",
        description: "Client has been granted access to this order.",
      });
      setSelectedClientId("");
      onClientLinked();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to link client",
        variant: "destructive",
      });
    }
    setIsLinking(false);
  };

  const handleUnlinkClient = async () => {
    if (!user?.id) return;

    setIsUnlinking(true);
    const result = await unlinkClientFromOrder(orderId, user.id);

    if (result.success) {
      toast({
        title: "Access Revoked",
        description: "Client access has been removed from this order.",
      });
      onClientLinked();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to revoke access",
        variant: "destructive",
      });
    }
    setIsUnlinking(false);
  };

  const handleSendInvite = async () => {
    if (!currentClient || !user?.id) return;

    setIsSendingInvite(true);
    await logInviteSent(orderId, user.id, currentClient.email);

    toast({
      title: "Invite Sent",
      description: `Login information sent to ${currentClient.email}`,
    });
    setIsSendingInvite(false);
  };

  return (
    <Card className="border-dashed border-amber-500/50 bg-amber-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-4 w-4 text-amber-500" />
          Client Access
          <Badge variant="outline" className="ml-auto text-xs font-normal">
            Admin Only
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Client Display */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Current Client:</span>
          {currentClient ? (
            <Badge variant="secondary" className="font-normal">
              {currentClient.name}
              {currentClient.email && (
                <span className="ml-1 text-muted-foreground">
                  ({currentClient.email})
                </span>
              )}
            </Badge>
          ) : (
            <Badge variant="outline" className="font-normal text-muted-foreground">
              None assigned
            </Badge>
          )}
        </div>

        {/* Link New Client */}
        {!currentClient && (
          <div className="flex gap-2">
            <Select
              value={selectedClientId}
              onValueChange={setSelectedClientId}
              disabled={isLoading}
            >
              <SelectTrigger className="flex-1 bg-background">
                <SelectValue
                  placeholder={isLoading ? "Loading clients..." : "Select a client"}
                />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {clients.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No client users found
                  </SelectItem>
                ) : (
                  clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                      {client.email && ` (${client.email})`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button
              onClick={handleLinkClient}
              disabled={!selectedClientId || isLinking}
              size="sm"
            >
              {isLinking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              <span className="ml-1 hidden sm:inline">Link</span>
            </Button>
          </div>
        )}

        {/* Actions for Linked Client */}
        {currentClient && (
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendInvite}
              disabled={isSendingInvite}
            >
              {isSendingInvite ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Mail className="h-4 w-4 mr-1" />
              )}
              Send Login Invite
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnlinkClient}
              disabled={isUnlinking}
              className="text-destructive hover:text-destructive"
            >
              {isUnlinking ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <UserX className="h-4 w-4 mr-1" />
              )}
              Remove Access
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientAccessSection;
