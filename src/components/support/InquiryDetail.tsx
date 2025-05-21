import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { SupportInquiry, SupportReply } from "@/types/support";
import { useToast } from "@/hooks/use-toast";

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
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin"; // Fixed comparison - only check for "admin" role

  useEffect(() => {
    if (!inquiryId) return;

    const loadInquiry = () => {
      try {
        const storedInquiries: SupportInquiry[] = JSON.parse(
          localStorage.getItem("supportInquiries") || "[]"
        );
        
        const foundInquiry = storedInquiries.find(inq => inq.id === inquiryId);
        
        if (!foundInquiry) {
          navigate("/support");
          return;
        }
        
        // Check if user has access to this inquiry
        if (!isAdmin && foundInquiry.userId !== user?.id) {
          navigate("/support");
          return;
        }
        
        setInquiry(foundInquiry);
      } catch (error) {
        console.error("Error loading inquiry:", error);
        navigate("/support");
      }
    };

    loadInquiry();
  }, [inquiryId, user, isAdmin, navigate]);

  const handleDeleteInquiry = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!inquiry) return;
    
    setIsDeleting(true);
    try {
      const storedInquiries: SupportInquiry[] = JSON.parse(
        localStorage.getItem("supportInquiries") || "[]"
      );
      
      const updatedInquiries = storedInquiries.filter(
        inq => inq.id !== inquiry.id
      );
      
      localStorage.setItem("supportInquiries", JSON.stringify(updatedInquiries));
      
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

  const handleSubmitReply = () => {
    if (!inquiry || !user || !replyText.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      const newReply: SupportReply = {
        id: uuidv4(),
        inquiryId: inquiry.id,
        userId: user.id,
        userName: user.full_name || user.email,
        userRole: user.role,
        message: replyText.trim(),
        createdAt: new Date().toISOString(),
      };
      
      // Get all inquiries
      const allInquiries: SupportInquiry[] = JSON.parse(
        localStorage.getItem("supportInquiries") || "[]"
      );
      
      // Find and update the current inquiry
      const updatedInquiries = allInquiries.map(inq => {
        if (inq.id === inquiry.id) {
          // Add reply and update status
          const newStatus: "open" | "replied" | "closed" = isAdmin ? "replied" : inq.status;
          return {
            ...inq,
            replies: [...inq.replies, newReply],
            status: newStatus,
          };
        }
        return inq;
      });
      
      // Save back to localStorage
      localStorage.setItem("supportInquiries", JSON.stringify(updatedInquiries));
      
      // Update local state
      const updatedInquiry = updatedInquiries.find(inq => inq.id === inquiry.id) as SupportInquiry;
      setInquiry(updatedInquiry);
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
  
  const handleCloseInquiry = () => {
    if (!inquiry || !isAdmin) return;
    
    try {
      // Get all inquiries
      const allInquiries: SupportInquiry[] = JSON.parse(
        localStorage.getItem("supportInquiries") || "[]"
      );
      
      // Find and update the current inquiry
      const updatedInquiries = allInquiries.map(inq => {
        if (inq.id === inquiry.id) {
          return {
            ...inq,
            status: "closed" as const,
          };
        }
        return inq;
      });
      
      // Save back to localStorage
      localStorage.setItem("supportInquiries", JSON.stringify(updatedInquiries));
      
      // Update local state
      const updatedInquiry = updatedInquiries.find(inq => inq.id === inquiry.id) as SupportInquiry;
      setInquiry(updatedInquiry);
      
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

  if (!inquiry) {
    return <div className="p-4">Loading...</div>;
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
      {inquiry.replies.length > 0 && (
        <div className="space-y-4 mt-6">
          <h3 className="text-lg font-medium">Replies</h3>
          {inquiry.replies.map((reply) => (
            <Card key={reply.id} className={`${reply.userRole === "admin" ? "border-l-4 border-l-blue-500" : ""}`}>
              <CardHeader className="py-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-medium">
                    {reply.userName}
                    {reply.userRole === "admin" && (
                      <Badge className="ml-2 bg-blue-500">Admin - {reply.userName}</Badge>
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
