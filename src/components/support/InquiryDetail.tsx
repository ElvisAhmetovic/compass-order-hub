
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useSupabaseAuth } from "@/context/SupabaseAuthContext";
import { format } from "date-fns";
import { SupportInquiry, SupportReply } from "@/types/support";
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

export const InquiryDetail = () => {
  const { inquiryId } = useParams<{ inquiryId: string }>();
  const [inquiry, setInquiry] = useState<SupportInquiry | null>(null);
  const [replies, setReplies] = useState<SupportReply[]>([]);
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { user: supabaseUser } = useSupabaseAuth();
  const currentUser = supabaseUser || user;
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    if (!inquiryId || !currentUser) return;
    
    const loadInquiry = async () => {
      setIsLoading(true);
      try {
        // Get the inquiry
        const { data: inquiryData, error: inquiryError } = await supabase
          .from('support_inquiries')
          .select('*')
          .eq('id', inquiryId)
          .single();

        if (inquiryError) {
          throw inquiryError;
        }

        if (!inquiryData) {
          navigate("/support");
          return;
        }

        // Map the inquiry data
        const mappedInquiry: SupportInquiry = {
          id: inquiryData.id,
          userId: inquiryData.user_id,
          userEmail: inquiryData.user_email,
          userName: inquiryData.user_name,
          subject: inquiryData.subject,
          message: inquiryData.message,
          createdAt: inquiryData.created_at,
          status: inquiryData.status as "open" | "replied" | "closed",
        };

        // Get the replies
        const { data: repliesData, error: repliesError } = await supabase
          .from('support_replies')
          .select('*')
          .eq('inquiry_id', inquiryId)
          .order('created_at', { ascending: true });

        if (repliesError) {
          throw repliesError;
        }

        // Map the replies data
        const mappedReplies: SupportReply[] = repliesData.map(reply => ({
          id: reply.id,
          inquiryId: reply.inquiry_id,
          userId: reply.user_id,
          userName: reply.user_name,
          userRole: reply.user_role,
          message: reply.message,
          createdAt: reply.created_at,
        }));

        setInquiry(mappedInquiry);
        setReplies(mappedReplies);
      } catch (error) {
        console.error("Error loading inquiry:", error);
        toast({
          title: "Error",
          description: "Could not load the inquiry details.",
          variant: "destructive",
        });
        navigate("/support");
      } finally {
        setIsLoading(false);
      }
    };

    loadInquiry();
  }, [inquiryId, currentUser, navigate, toast, isAdmin]);

  const handleDeleteInquiry = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!inquiry || !isAdmin) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('support_inquiries')
        .delete()
        .eq('id', inquiry.id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Inquiry deleted",
        description: "The support inquiry has been permanently deleted.",
      });
      
      // Navigate back to support page
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
    if (!inquiry || !currentUser || !replyText.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('support_replies')
        .insert({
          inquiry_id: inquiry.id,
          user_id: currentUser.id,
          user_name: currentUser.email || 'User',
          user_role: currentUser.role,
          message: replyText.trim()
        });
      
      if (error) {
        throw error;
      }
      
      // If admin is replying, update status to "replied"
      if (isAdmin && inquiry.status === 'open') {
        const { error: statusError } = await supabase
          .from('support_inquiries')
          .update({ status: 'replied' })
          .eq('id', inquiry.id);
        
        if (statusError) {
          throw statusError;
        }
        
        // Update local state
        setInquiry(prev => prev ? { ...prev, status: 'replied' } : null);
      }
      
      // Reload the replies
      const { data: newReplies, error: repliesError } = await supabase
        .from('support_replies')
        .select('*')
        .eq('inquiry_id', inquiry.id)
        .order('created_at', { ascending: true });
      
      if (repliesError) {
        throw repliesError;
      }
      
      // Map the replies data
      const mappedReplies: SupportReply[] = newReplies.map(reply => ({
        id: reply.id,
        inquiryId: reply.inquiry_id,
        userId: reply.user_id,
        userName: reply.user_name,
        userRole: reply.user_role,
        message: reply.message,
        createdAt: reply.created_at,
      }));
      
      setReplies(mappedReplies);
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
      
      if (error) {
        throw error;
      }
      
      // Update local state
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
    return <div className="p-4">Loading...</div>;
  }

  if (!inquiry) {
    return <div className="p-4">Inquiry not found.</div>;
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
                From: {inquiry.userName} ({inquiry.userEmail})
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
          <span className="text-sm text-gray-500">
            {format(new Date(inquiry.createdAt), "PPpp")}
          </span>
        </CardFooter>
      </Card>
      
      {/* Replies */}
      {replies.length > 0 && (
        <div className="space-y-4 mt-6">
          <h3 className="text-lg font-medium">Replies</h3>
          {replies.map((reply) => (
            <Card key={reply.id} className={`${reply.userRole === "admin" ? "border-l-4 border-l-blue-500" : ""}`}>
              <CardHeader className="py-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-medium">
                    {reply.userName}
                    {reply.userRole === "admin" && (
                      <Badge className="ml-2 bg-blue-500">Admin</Badge>
                    )}
                  </CardTitle>
                  <span className="text-xs text-gray-500">
                    {format(new Date(reply.createdAt), "PPpp")}
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
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <p className="font-medium">{inquiry.subject}</p>
                <p className="text-xs text-gray-500 mt-1">From: {inquiry.userName}</p>
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
