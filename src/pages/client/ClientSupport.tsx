import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { getUnreadCountsForInquiries } from "@/services/supportReadService";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useLanguage } from "@/context/ClientLanguageContext";

interface InquiryWithUnread extends ClientSupportInquiry {
  unread_count: number;
}

const ClientSupport = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [inquiries, setInquiries] = useState<InquiryWithUnread[]>([]);
  const [orders, setOrders] = useState<{ id: string; company_name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const isComplaint = searchParams.get("complaint") === "true";
    const complaintOrderId = searchParams.get("orderId");

    if (isComplaint && orders.length > 0) {
      const matchedOrder = orders.find(o => o.id === complaintOrderId);
      if (matchedOrder) {
        setSubject(`Einwand / Complaint - ${matchedOrder.company_name}`);
        setSelectedOrderId(matchedOrder.id);
      } else {
        setSubject("Einwand / Complaint");
        if (complaintOrderId) setSelectedOrderId(complaintOrderId);
      }
      setDialogOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [orders, searchParams]);

  useEffect(() => {
    const channel = supabase
      .channel('client-support-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'support_inquiries'
      }, () => {
        loadData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'support_replies'
      }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [inquiriesData, ordersData] = await Promise.all([
      fetchClientInquiries(),
      fetchClientOrders(),
    ]);
    
    const inquiryIds = inquiriesData.map(i => i.id);
    const unreadCounts = await getUnreadCountsForInquiries(inquiryIds);
    
    const inquiriesWithUnread = inquiriesData.map(inquiry => ({
      ...inquiry,
      unread_count: unreadCounts.get(inquiry.id) || 0
    }));
    
    setInquiries(inquiriesWithUnread);
    setOrders(ordersData);
    setIsLoading(false);
  };

  const handleCreateInquiry = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: t('support.missingInfo'),
        description: t('support.missingInfoDesc'),
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
        title: t('support.inquiryCreated'),
        description: t('support.inquiryCreatedDesc'),
      });
      setSubject("");
      setMessage("");
      setSelectedOrderId("");
      setDialogOpen(false);
      loadData();
    } else {
      toast({
        title: t('support.error'),
        description: result.error || t('support.createError'),
        variant: "destructive",
      });
    }
    setIsCreating(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-blue-500 hover:bg-blue-600">{t('support.statusOpen')}</Badge>;
      case "in_progress":
        return <Badge className="bg-amber-500 hover:bg-amber-600">{t('support.statusInProgress')}</Badge>;
      case "closed":
        return <Badge variant="secondary">{t('support.statusClosed')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <ClientLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('support.title')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('support.subtitle')}
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('support.newInquiry')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{t('support.createInquiry')}</DialogTitle>
                <DialogDescription>
                  {t('support.createDesc')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">{t('support.subject')}</Label>
                  <Input
                    id="subject"
                    placeholder={t('support.subjectPlaceholder')}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="order">{t('support.relatedOrder')}</Label>
                  <Select
                    value={selectedOrderId}
                    onValueChange={(value) => setSelectedOrderId(value === "none" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('support.selectOrder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('support.noSpecificOrder')}</SelectItem>
                      {orders.map((order) => (
                        <SelectItem key={order.id} value={order.id}>
                          {order.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">{t('support.message')}</Label>
                  <Textarea
                    id="message"
                    placeholder={t('support.messagePlaceholder')}
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
                  {t('support.cancel')}
                </Button>
                <Button onClick={handleCreateInquiry} disabled={isCreating}>
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {t('support.submit')}
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
              <p className="text-muted-foreground">{t('support.noInquiries')}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t('support.noInquiriesDesc')}
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
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1 text-xs text-primary">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {t('support.viewConversation')}
                    </div>
                    {inquiry.unread_count > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-red-500 font-medium">
                          {inquiry.unread_count} {t('support.new')}
                        </span>
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                        </span>
                      </div>
                    )}
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
