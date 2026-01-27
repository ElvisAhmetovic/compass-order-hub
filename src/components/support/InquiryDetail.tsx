import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SupportInquiry {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  subject: string;
  message: string;
  created_at: string;
  status: "open" | "replied" | "closed";
}

interface SupportReply {
  id: string;
  inquiry_id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  message: string;
  created_at: string;
}

export const InquiryDetail = () => {
  const { id: inquiryId } = useParams<{ id: string }>();
  const [inquiry, setInquiry] = useState<SupportInquiry | null>(null);
  const [replies, setReplies] = useState<SupportReply[]>([]);
  const [replyText, setReplyText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!inquiryId) return;
    loadInquiry();
  }, [inquiryId, user, isAdmin]);

  const loadInquiry = async () => {
    if (!inquiryId || !user) return;
    
    setIsLoading(true);
    try {
      // Fetch the inquiry
      const { data: inquiryData, error: inquiryError } = await supabase
        .from('support_inquiries')
        .select('*')
        .eq('id', inquiryId)
        .maybeSingle();

      if (inquiryError) throw inquiryError;

      if (!inquiryData) {
        toast({
          variant: "destructive",
          title: "Not found",
          description: "This inquiry does not exist.",
        });
        navigate("/support");
        return;
      }

      // Check if user has access to this inquiry
      if (!isAdmin && inquiryData.user_id !== user.id) {
        toast({
          variant: "destructive",
          title: "Access denied",
          description: "You don't have permission to view this inquiry.",
        });
        navigate("/support");
        return;
      }

      setInquiry({
        ...inquiryData,
        status: inquiryData.status as "open" | "replied" | "closed"
      });

      // Fetch replies
      const { data: repliesData, error: repliesError } = await supabase
        .from('support_replies')
        .select('*')
        .eq('inquiry_id', inquiryId)
        .order('created_at', { ascending: true });

      if (repliesError) throw repliesError;

      setReplies(repliesData || []);
    } catch (error) {
      console.error("Error loading inquiry:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load the inquiry.",
      });
      navigate("/support");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteInquiry = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!inquiry) return;
    
    setIsDeleting(true);
    try {
      // Delete replies first (foreign key constraint)
      await supabase
        .from('support_replies')
        .delete()
        .eq('inquiry_id', inquiry.id);

      // Then delete the inquiry
      const { error } = await supabase
        .from('support_inquiries')
        .delete()
        .eq('id', inquiry.id);

      if (error) throw error;
      
      toast({
        title: "Inquiry deleted",
        description: "The support inquiry has been permanently deleted.",
      });
      
      navigate("/support");
    } catch (error) {
      console.error("Error deleting inquiry:", error);
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: "There was a problem deleting the inquiry. Please try again.",
      });
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleSubmitReply = async () => {
    if (!inquiry || !user || !replyText.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      // Insert the reply
      const { data: newReply, error: replyError } = await supabase
        .from('support_replies')
        .insert({
          inquiry_id: inquiry.id,
          user_id: user.id,
          user_name: user.full_name || user.email,
          user_role: user.role,
          message: replyText.trim()
        })
        .select()
        .single();

      if (replyError) throw replyError;

      // Update inquiry status if admin replied
      if (isAdmin && inquiry.status === 'open') {
        const { error: updateError } = await supabase
          .from('support_inquiries')
          .update({ status: 'replied' })
          .eq('id', inquiry.id);

        if (updateError) throw updateError;

        setInquiry(prev => prev ? { ...prev, status: 'replied' } : null);
      }

      setReplies(prev => [...prev, newReply]);
      setReplyText("");
      
      toast({
        title: "Reply Sent",
        description: "Your reply has been added to the inquiry."
      });
    } catch (error) {
      console.error("Error submitting reply:", error);
      toast({
        title: "Error",
        description: "There was a problem submitting your reply.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-yellow-500";
      case "replied":
        return "bg-blue-500";
      case "closed":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };
  
  const handleCloseInquiry = async () => {
    if (!inquiry || !isAdmin) return;
    
    try {
      const { error } = await supabase
        .from('support_inquiries')
        .update({ status: 'closed' })
        .eq('id', inquiry.id);

      if (error) throw error;

      setInquiry(prev => prev ? { ...prev, status: 'closed' } : null);
      
      toast({
        title: "Inquiry Closed",
        description: "This support inquiry has been marked as closed."
      });
    } catch (error) {
      console.error("Error closing inquiry:", error);
      toast({
        title: "Error",
        description: "There was a problem closing the inquiry.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="p-4 text-muted-foreground">Loading...</div>;
  }

  if (!inquiry) {
    return <div className="p-4 text-muted-foreground">Inquiry not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/support")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Inquiries
        </Button>
        
        {isAdmin && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteInquiry}
          >
            <Trash className="h-4 w-4 mr-1" /> Delete Inquiry
          </Button>
        )}
      </div>
      
      {/* Original Inquiry */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl font-semibold">{inquiry.subject}</CardTitle>
              <CardDescription>
                From: {inquiry.user_name} ({inquiry.user_email})
              </CardDescription>
            </div>
            <Badge className={getStatusColor(inquiry.status)}>
              {inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{inquiry.message}</p>
        </CardContent>
        <CardFooter>
          <span className="text-sm text-muted-foreground">
            {format(new Date(inquiry.created_at), "PPpp")}
          </span>
        </CardFooter>
      </Card>
      
      {/* Replies */}
      {replies.length > 0 && (
        <div className="space-y-4 mt-6">
          <h3 className="text-lg font-medium">Replies</h3>
          {replies.map((reply) => (
            <Card key={reply.id} className={`${reply.user_role === "admin" ? "border-l-4 border-l-blue-500" : ""}`}>
              <CardHeader className="py-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-medium">
                    {reply.user_name}
                    {reply.user_role === "admin" && (
                      <Badge className="ml-2 bg-blue-500">Admin</Badge>
                    )}
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(reply.created_at), "PPpp")}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="py-2">
                <p className="whitespace-pre-wrap">{reply.message}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Reply Form (if inquiry is not closed) */}
      {inquiry.status !== "closed" && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Add Reply</h3>
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type your reply here..."
            className="min-h-[120px] mb-3"
            maxLength={5000}
          />
          <div className="flex justify-end gap-2">
            {isAdmin && (
              <Button 
                variant="outline" 
                onClick={handleCloseInquiry}
                disabled={isSubmitting}
              >
                Close Inquiry
              </Button>
            )}
            <Button
              onClick={handleSubmitReply}
              disabled={!replyText.trim() || isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send Reply"}
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Support Inquiry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this inquiry? This action cannot be undone.
              <div className="mt-4 p-3 bg-muted rounded-md">
                <p className="font-medium">{inquiry.subject}</p>
                <p className="text-xs text-muted-foreground mt-1">From: {inquiry.user_name}</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
