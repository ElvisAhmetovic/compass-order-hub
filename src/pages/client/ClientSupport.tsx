import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  HelpCircle,
  Plus,
  Loader2,
  MessageSquare,
  Package,
  Clock,
} from "lucide-react";
import ClientLayout from "@/components/client-portal/ClientLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  fetchClientInquiries,
  createClientInquiry,
  fetchClientOrders,
  ClientSupportInquiry,
} from "@/services/clientSupportService";
import { format } from "date-fns";

const ClientSupport = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [inquiries, setInquiries] = useState<ClientSupportInquiry[]>([]);
  const [orders, setOrders] = useState<{ id: string; company_name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [inquiriesData, ordersData] = await Promise.all([
      fetchClientInquiries(),
      fetchClientOrders(),
    ]);
    setInquiries(inquiriesData);
    setOrders(ordersData);
    setIsLoading(false);
  };

  const handleCreateInquiry = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both a subject and message.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    const result = await createClientInquiry({
      subject: subject.trim(),
      message: message.trim(),
      orderId: selectedOrderId || undefined,
    });

    if (result.success) {
      toast({
        title: "Inquiry Created",
        description: "Your support inquiry has been submitted.",
      });
      setSubject("");
      setMessage("");
      setSelectedOrderId("");
      setDialogOpen(false);
      loadData();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to create inquiry",
        variant: "destructive",
      });
    }
    setIsCreating(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Open</Badge>;
      case "in_progress":
        return <Badge className="bg-amber-500 hover:bg-amber-600">In Progress</Badge>;
      case "closed":
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <ClientLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Support</h1>
            <p className="text-muted-foreground mt-1">
              Get help with your orders
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Inquiry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create Support Inquiry</DialogTitle>
                <DialogDescription>
                  Submit a new support request. Our team will respond as soon as
                  possible.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="Brief description of your issue"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="order">Related Order (Optional)</Label>
                  <Select
                    value={selectedOrderId}
                    onValueChange={(value) => setSelectedOrderId(value === "none" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an order..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific order</SelectItem>
                      {orders.map((order) => (
                        <SelectItem key={order.id} value={order.id}>
                          {order.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Describe your issue in detail..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateInquiry} disabled={isCreating}>
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Submit Inquiry
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : inquiries.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No support inquiries yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Click "New Inquiry" to create your first support request.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {inquiries.map((inquiry) => (
              <Card
                key={inquiry.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate(`/client/support/${inquiry.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">
                        {inquiry.subject}
                      </CardTitle>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {format(new Date(inquiry.created_at), "MMM d, yyyy")}
                        </div>
                        {inquiry.order_company_name && (
                          <div className="flex items-center gap-1">
                            <Package className="h-3.5 w-3.5" />
                            {inquiry.order_company_name}
                          </div>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(inquiry.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {inquiry.message}
                  </p>
                  <div className="flex items-center gap-1 mt-3 text-xs text-primary">
                    <MessageSquare className="h-3.5 w-3.5" />
                    View conversation
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ClientLayout>
  );
};

export default ClientSupport;
