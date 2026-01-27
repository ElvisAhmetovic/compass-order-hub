import { useState, useEffect, useMemo } from "react";
import { Shield, UserPlus, Mail, UserX, Loader2, Check, ChevronsUpDown, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import {
  getClientUsers,
  getClientById,
  linkClientToOrder,
  unlinkClientFromOrder,
  sendClientInvite,
  ClientUser,
} from "@/services/clientAccessService";
import { cn } from "@/lib/utils";

interface ClientAccessSectionProps {
  orderId: string;
  companyName: string;
  currentClientId: string | null;
  onClientLinked: () => void;
}

const ClientAccessSection = ({
  orderId,
  companyName,
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
  const [open, setOpen] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

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

  const selectedClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId);
  }, [clients, selectedClientId]);

  const handleLinkClient = async () => {
    if (!selectedClientId || !user?.id) return;

    const clientToLink = clients.find((c) => c.id === selectedClientId);
    if (!clientToLink) return;

    setIsLinking(true);
    const result = await linkClientToOrder(
      orderId,
      selectedClientId,
      user.id,
      clientToLink.name,
      clientToLink.email
    );

    if (result.success) {
      toast({
        title: "Client Linked",
        description: `${clientToLink.name} has been granted access to this order.`,
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
    if (!user?.id || !currentClient) return;

    setIsUnlinking(true);
    const result = await unlinkClientFromOrder(
      orderId,
      user.id,
      currentClient.name,
      currentClient.email
    );

    if (result.success) {
      toast({
        title: "Access Revoked",
        description: `${currentClient.name}'s access has been removed from this order.`,
      });
      setShowRemoveDialog(false);
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
    const result = await sendClientInvite({
      clientEmail: currentClient.email,
      clientName: currentClient.name,
      orderId,
      companyName,
      senderName: user.email || "Admin",
      senderId: user.id,
    });

    if (result.success) {
      toast({
        title: "Invite Sent",
        description: `Portal access invite sent to ${currentClient.email}`,
      });
    } else {
      toast({
        title: "Error Sending Invite",
        description: result.error || "Failed to send invite email",
        variant: "destructive",
      });
    }
    setIsSendingInvite(false);
  };

  return (
    <>
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

          {/* Link New Client - Searchable Combobox */}
          {!currentClient && (
            <div className="flex gap-2">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="flex-1 justify-between bg-background"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      "Loading clients..."
                    ) : selectedClient ? (
                      <span className="truncate">
                        {selectedClient.name}
                        {selectedClient.email && ` (${selectedClient.email})`}
                      </span>
                    ) : (
                      "Select a client..."
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search clients..." />
                    <CommandList>
                      <CommandEmpty>No clients found.</CommandEmpty>
                      <CommandGroup>
                        {clients.map((client) => (
                          <CommandItem
                            key={client.id}
                            value={`${client.name} ${client.email}`}
                            onSelect={() => {
                              setSelectedClientId(client.id);
                              setOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedClientId === client.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span>{client.name}</span>
                              {client.email && (
                                <span className="text-xs text-muted-foreground">
                                  {client.email}
                                </span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
                onClick={() => setShowRemoveDialog(true)}
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

      {/* Confirmation Dialog for Remove Access */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Client Access?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke <strong>{currentClient?.name}</strong>'s access to this
              order. They will no longer be able to view this order in their client
              portal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUnlinking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnlinkClient}
              disabled={isUnlinking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isUnlinking ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              Remove Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ClientAccessSection;
