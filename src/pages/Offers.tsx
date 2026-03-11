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
import { Eye, Send, Trash2 } from "lucide-react";
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
  sent_by_name: string;
  status: string;
  created_at: string;
}

const Offers = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [deleteOffer, setDeleteOffer] = useState<Offer | null>(null);

  useEffect(() => {
    fetchOffers();
  }, []);

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
            <DialogContent className="sm:max-w-[500px]">
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
                      <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">{selectedOffer.description}</p>
                    </div>
                  )}
                  <Badge>{selectedOffer.status}</Badge>
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
        </Layout>
      </div>
    </div>
  );
};

export default Offers;
