
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { SupportInquiry } from "@/types/support";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Trash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface InquiriesListProps {
  showAll?: boolean;
}

export const InquiriesList = ({ showAll = false }: InquiriesListProps) => {
  const [inquiries, setInquiries] = useState<SupportInquiry[]>([]);
  const [inquiryToDelete, setInquiryToDelete] = useState<SupportInquiry | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin"; // Fixed comparison - only check for "admin" role

  useEffect(() => {
    loadInquiries();
  }, [user, isAdmin, showAll]);

  const loadInquiries = () => {
    try {
      const storedInquiries: SupportInquiry[] = JSON.parse(
        localStorage.getItem("supportInquiries") || "[]"
      );
      
      // For admin showing all inquiries or the "open" tab
      if (isAdmin && showAll) {
        setInquiries(storedInquiries);
        return;
      }
      
      // For non-admin users, only show their own inquiries
      if (!isAdmin) {
        const userInquiries = storedInquiries.filter(inquiry => inquiry.userId === user?.id);
        setInquiries(userInquiries);
        return;
      }
      
      // For admin in "open" tab, filter to show only open inquiries
      const openInquiries = storedInquiries.filter(inquiry => inquiry.status === "open");
      setInquiries(openInquiries);
    } catch (error) {
      console.error("Error loading inquiries:", error);
      setInquiries([]);
    }
  };

  const handleDeleteClick = (inquiry: SupportInquiry) => {
    setInquiryToDelete(inquiry);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!inquiryToDelete) return;
    
    setIsDeleting(true);
    try {
      const storedInquiries: SupportInquiry[] = JSON.parse(
        localStorage.getItem("supportInquiries") || "[]"
      );
      
      const updatedInquiries = storedInquiries.filter(
        inquiry => inquiry.id !== inquiryToDelete.id
      );
      
      localStorage.setItem("supportInquiries", JSON.stringify(updatedInquiries));
      setInquiries(prevInquiries => 
        prevInquiries.filter(inquiry => inquiry.id !== inquiryToDelete.id)
      );
      
      toast({
        title: "Inquiry deleted",
        description: "The support inquiry has been permanently deleted.",
      });
    } catch (error) {
      console.error("Error deleting inquiry:", error);
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: "There was a problem deleting the inquiry. Please try again.",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setInquiryToDelete(null);
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

  const handleViewInquiry = (inquiryId: string) => {
    navigate(`/support/${inquiryId}`);
  };

  return (
    <>
      <div className="space-y-4">
        {inquiries.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">No inquiries found.</p>
          </div>
        ) : (
          inquiries.map((inquiry) => (
            <Card key={inquiry.id} className="mb-4">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-semibold">{inquiry.subject}</CardTitle>
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
                <p className="text-sm whitespace-pre-wrap line-clamp-3">{inquiry.message}</p>
              </CardContent>
              <CardFooter className="flex justify-between items-center pt-2">
                <span className="text-xs text-gray-500">
                  {format(new Date(inquiry.createdAt), "PPpp")}
                </span>
                <div className="flex gap-2">
                  {isAdmin && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteClick(inquiry)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewInquiry(inquiry.id)}
                  >
                    {inquiry.replies.length > 0 ? `View (${inquiry.replies.length} replies)` : "View"}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Support Inquiry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this inquiry? This action cannot be undone.
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <p className="font-medium">{inquiryToDelete?.subject}</p>
                <p className="text-xs text-gray-500 mt-1">From: {inquiryToDelete?.userName}</p>
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
    </>
  );
};
