import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Clock, User, Loader2, Package } from "lucide-react";
import ClientLayout from "@/components/client-portal/ClientLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  fetchClientInquiryById,
  addClientReply,
  ClientSupportInquiry,
  ClientSupportReply,
} from "@/services/clientSupportService";
import { format } from "date-fns";

const ClientSupportDetail = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [inquiry, setInquiry] = useState<ClientSupportInquiry | null>(null);
  const [replies, setReplies] = useState<ClientSupportReply[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (ticketId) {
      loadInquiry();
    }
  }, [ticketId]);

  const loadInquiry = async () => {
    if (!ticketId) return;

    setIsLoading(true);
    const result = await fetchClientInquiryById(ticketId);
    setInquiry(result.inquiry);
    setReplies(result.replies);
    setIsLoading(false);
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !ticketId) return;

    setIsSending(true);
    const result = await addClientReply(ticketId, replyMessage.trim());

    if (result.success) {
      toast({
        title: "Reply Sent",
        description: "Your message has been sent to our support team.",
      });
      setReplyMessage("");
      loadInquiry();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to send reply",
        variant: "destructive",
      });
    }
    setIsSending(false);
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

  if (isLoading) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ClientLayout>
    );
  }

  if (!inquiry) {
    return (
      <ClientLayout>
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => navigate("/client/support")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Support
          </Button>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Ticket not found</p>
            </CardContent>
          </Card>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/client/support")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{inquiry.subject}</h1>
            <div className="flex items-center gap-3 mt-1">
              {getStatusBadge(inquiry.status)}
              <span className="text-sm text-muted-foreground">
                Created {format(new Date(inquiry.created_at), "MMM d, yyyy 'at' h:mm a")}
              </span>
            </div>
          </div>
        </div>

        {/* Linked Order */}
        {inquiry.order_company_name && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-3">
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Linked Order:</span>
                <span className="font-medium">{inquiry.order_company_name}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Original Message */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">{inquiry.user_name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(inquiry.created_at), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-foreground whitespace-pre-wrap">{inquiry.message}</p>
          </CardContent>
        </Card>

        {/* Replies Thread */}
        {replies.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Conversation</h3>
            {replies.map((reply) => {
              const isSupport = reply.user_role !== "client";
              return (
                <Card
                  key={reply.id}
                  className={isSupport ? "border-green-500/20 bg-green-500/5" : ""}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          isSupport
                            ? "bg-green-500/10"
                            : "bg-primary/10"
                        }`}
                      >
                        <User
                          className={`h-5 w-5 ${
                            isSupport ? "text-green-600" : "text-primary"
                          }`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{reply.user_name}</CardTitle>
                          {isSupport && (
                            <Badge variant="outline" className="text-xs">
                              Support Team
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(reply.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground whitespace-pre-wrap">{reply.message}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Reply Form */}
        {inquiry.status !== "closed" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add a Reply</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Type your message here..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={4}
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSendReply}
                  disabled={!replyMessage.trim() || isSending}
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send Reply
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Closed Notice */}
        {inquiry.status === "closed" && (
          <Card className="border-muted bg-muted/20">
            <CardContent className="py-6 text-center">
              <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                This ticket has been closed. If you need further assistance, please create
                a new inquiry.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </ClientLayout>
  );
};

export default ClientSupportDetail;
