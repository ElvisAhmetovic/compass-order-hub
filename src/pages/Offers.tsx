import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import Sidebar from "@/components/dashboard/Sidebar";
import { toast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Eye, Send, Trash2, Loader2, CheckCircle2, Save } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

interface Offer {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  client_address: string | null;
  company_name: string;
  description: string | null;
  price: number;
  currency: string;
  sent_by: string | null;
  sent_by_name: string;
  order_data: any;
  status: string;
  created_at: string;
}

const Offers = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [deleteOffer, setDeleteOffer] = useState<Offer | null>(null);
  const [resendingOffer, setResendingOffer] = useState<string | null>(null);
  const [confirmOffer, setConfirmOffer] = useState<Offer | null>(null);
  const [confirmingOffer, setConfirmingOffer] = useState<string | null>(null);
  const [sendToClientOnConfirm, setSendToClientOnConfirm] = useState(false);
  const [savingOffer, setSavingOffer] = useState(false);
  const [editForm, setEditForm] = useState({
    client_name: "",
    company_name: "",
    client_email: "",
    client_phone: "",
    client_address: "",
    price: "",
    description: "",
  });

  useEffect(() => {
    fetchOffers();

    const channel = supabase
      .channel('offers-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offers' }, () => {
        fetchOffers();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (selectedOffer) {
      setEditForm({
        client_name: selectedOffer.client_name,
        company_name: selectedOffer.company_name,
        client_email: selectedOffer.client_email,
        client_phone: selectedOffer.client_phone || "",
        client_address: selectedOffer.client_address || "",
        price: String(selectedOffer.price),
        description: selectedOffer.description || "",
      });
    }
  }, [selectedOffer]);

  const fetchOffers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("offers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching offers:", error);
      toast({ variant: "destructive", title: "Error loading offers" });
    } else {
      setOffers((data as Offer[]) || []);
    }
    setLoading(false);
  };

  const handleSaveOffer = async () => {
    if (!selectedOffer) return;
    setSavingOffer(true);
    try {
      const updatedFields = {
        client_name: editForm.client_name.trim(),
        company_name: editForm.company_name.trim(),
        client_email: editForm.client_email.trim(),
        client_phone: editForm.client_phone.trim() || null,
        client_address: editForm.client_address.trim() || null,
        price: parseFloat(editForm.price) || 0,
        description: editForm.description.trim() || null,
      };

      const { error } = await supabase
        .from("offers")
        .update(updatedFields)
        .eq("id", selectedOffer.id);

      if (error) throw error;

      // Update local state
      const updated = { ...selectedOffer, ...updatedFields };
      setSelectedOffer(updated);
      setOffers(prev => prev.map(o => o.id === updated.id ? { ...o, ...updatedFields } : o));
      toast({ title: "Offer updated successfully" });
    } catch (err: any) {
      console.error("Save error:", err);
      toast({ variant: "destructive", title: "Failed to save changes", description: err.message });
    } finally {
      setSavingOffer(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteOffer) return;
    const { error } = await supabase
      .from("offers")
      .delete()
      .eq("id", deleteOffer.id);

    if (error) {
      toast({ variant: "destructive", title: "Error deleting offer" });
    } else {
      toast({ title: "Offer deleted" });
      fetchOffers();
    }
    setDeleteOffer(null);
  };


    setResendingOffer(offer.id);
    try {
      // 1. Create new offer with same data
      const { data: newOffer, error: insertError } = await supabase
        .from("offers")
        .insert({
          client_name: offer.client_name,
          client_email: offer.client_email,
          client_phone: offer.client_phone,
          client_address: offer.client_address,
          company_name: offer.company_name,
          description: offer.description,
          price: offer.price,
          currency: offer.currency,
          sent_by: offer.sent_by,
          sent_by_name: offer.sent_by_name,
          order_data: offer.order_data || {},
          status: "sent",
        })
        .select()
        .single();

      if (insertError || !newOffer) throw insertError || new Error("Failed to create new offer");

      // 2. Send email with new offer ID
      const { error: emailError } = await supabase.functions.invoke("send-offer-email", {
        body: {
          clientEmail: offer.client_email,
          clientName: offer.client_name,
          clientPhone: offer.client_phone || "",
          clientAddress: offer.client_address || "",
          companyName: offer.company_name,
          description: offer.description || "",
          price: offer.price,
          currency: offer.currency,
          senderName: offer.sent_by_name,
          offerId: newOffer.id,
        },
      });

      if (emailError) throw emailError;

      // 3. Delete old offer
      await supabase.from("offers").delete().eq("id", offer.id);

      toast({ title: "Offer resent successfully" });
      setSelectedOffer(null);
      fetchOffers();
    } catch (err: any) {
      console.error("Resend error:", err);
      toast({ variant: "destructive", title: "Failed to resend offer", description: err.message });
    } finally {
      setResendingOffer(null);
    }
  };

  const handleConfirmForClient = async () => {
    if (!confirmOffer) return;
    setConfirmingOffer(confirmOffer.id);
    try {
      const { data, error } = await supabase.functions.invoke("confirm-offer", {
        body: { offerId: confirmOffer.id, sendToClient: sendToClientOnConfirm },
      });
      if (error) throw error;
      if (data?.alreadyConfirmed) {
        toast({ title: "This offer was already confirmed" });
      } else {
        toast({ title: "Offer confirmed & order created" });
      }
      setSelectedOffer(null);
      fetchOffers();
    } catch (err: any) {
      console.error("Confirm error:", err);
      toast({ variant: "destructive", title: "Failed to confirm offer", description: err.message });
    } finally {
      setConfirmingOffer(null);
      setConfirmOffer(null);
      setSendToClientOnConfirm(false);
    }
  };

  const currencySymbol = (c: string) =>
    ({ EUR: "€", USD: "$", GBP: "£" }[c] || c);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex">
        <Layout>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Offers</h1>
                <p className="text-muted-foreground">All sent offers to clients</p>
              </div>
              <Badge variant="secondary" className="text-sm">
                {offers.length} offer{offers.length !== 1 ? "s" : ""}
              </Badge>
            </div>

            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading offers...</div>
            ) : offers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Send className="mx-auto h-12 w-12 mb-4 opacity-30" />
                <p>No offers sent yet</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Sent By</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {offers.map((offer) => (
                      <TableRow key={offer.id}>
                        <TableCell className="font-medium">{offer.client_name}</TableCell>
                        <TableCell>{offer.company_name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{offer.client_email}</TableCell>
                        <TableCell className="font-semibold">
                          {currencySymbol(offer.currency)}{offer.price.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>{offer.sent_by_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(offer.created_at), "dd.MM.yyyy HH:mm")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedOffer(offer)}>
                              <Eye className="h-4 w-4 mr-1" /> View
                            </Button>
                            {offer.status !== "confirmed" && (
                              <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700" onClick={() => setConfirmOffer(offer)}>
                                <CheckCircle2 className="h-4 w-4 mr-1" /> Confirm
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteOffer(offer)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* View Offer Dialog */}
          <Dialog open={!!selectedOffer} onOpenChange={() => setSelectedOffer(null)}>
            <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Offer Details</DialogTitle>
              </DialogHeader>
              {selectedOffer && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Client Name</p>
                      <p className="font-medium">{selectedOffer.client_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Company</p>
                      <p className="font-medium">{selectedOffer.company_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedOffer.client_email}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p className="font-medium">{selectedOffer.client_phone || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Address</p>
                      <p className="font-medium">{selectedOffer.client_address || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Price</p>
                      <p className="font-semibold text-primary">
                        {currencySymbol(selectedOffer.currency)}{selectedOffer.price.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Sent By</p>
                      <p className="font-medium">{selectedOffer.sent_by_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Date</p>
                      <p className="font-medium">{format(new Date(selectedOffer.created_at), "dd.MM.yyyy HH:mm")}</p>
                    </div>
                  </div>
                  {selectedOffer.description && (
                    <div>
                      <p className="text-muted-foreground text-sm mb-1">Description</p>
                      <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md max-h-[200px] overflow-y-auto">{selectedOffer.description}</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <Badge>{selectedOffer.status}</Badge>
                    <div className="flex gap-2">
                      {selectedOffer.status !== "confirmed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-600 text-green-600 hover:bg-green-50"
                          onClick={() => { setConfirmOffer(selectedOffer); }}
                          disabled={confirmingOffer === selectedOffer.id}
                        >
                          {confirmingOffer === selectedOffer.id ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                          )}
                          Confirm for Client
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleResend(selectedOffer)}
                        disabled={resendingOffer === selectedOffer.id}
                      >
                        {resendingOffer === selectedOffer.id ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 mr-1" />
                        )}
                        Send Again
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation */}
          <AlertDialog open={!!deleteOffer} onOpenChange={() => setDeleteOffer(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Offer</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete the offer for <strong>{deleteOffer?.client_name}</strong>? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Confirm for Client */}
          <Dialog open={!!confirmOffer} onOpenChange={(open) => { if (!open) { setConfirmOffer(null); setSendToClientOnConfirm(false); } }}>
            <DialogContent className="sm:max-w-[440px]">
              <DialogHeader>
                <DialogTitle>Confirm Offer for Client</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This will confirm the offer for <strong>{confirmOffer?.client_name}</strong> and automatically create an order in the system. The team will be notified.
                </p>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label htmlFor="send-to-client-toggle" className="text-sm font-medium cursor-pointer">
                    Send notification to client
                  </Label>
                  <Switch
                    id="send-to-client-toggle"
                    checked={sendToClientOnConfirm}
                    onCheckedChange={setSendToClientOnConfirm}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => { setConfirmOffer(null); setSendToClientOnConfirm(false); }}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-green-600 text-white hover:bg-green-700"
                    onClick={handleConfirmForClient}
                    disabled={confirmingOffer === confirmOffer?.id}
                  >
                    {confirmingOffer === confirmOffer?.id && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                    Confirm & Create Order
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </Layout>
      </div>
    </div>
  );
};

export default Offers;
