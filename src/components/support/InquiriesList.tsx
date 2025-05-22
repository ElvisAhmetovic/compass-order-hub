
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSupabaseAuth } from "@/context/SupabaseAuthContext";
import { format } from "date-fns";
import { SupportInquiry } from "@/types/support";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Trash, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface InquiriesListProps {
  showAll?: boolean;
}

export const InquiriesList = ({ showAll = false }: InquiriesListProps) => {
  const [inquiries, setInquiries] = useState<SupportInquiry[]>([]);
  const [inquiryToDelete, setInquiryToDelete] = useState<SupportInquiry | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Try both auth contexts to ensure we have a user
  const { user: authUser } = useAuth();
  const { user: supabaseUser } = useSupabaseAuth();
  
  // Use either authUser or supabaseUser, whichever is available
  const user = supabaseUser || authUser;
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAdminOrOwner = user?.role === "admin" || user?.role === "owner";

  useEffect(() => {
    if (user) {
      loadInquiries();
    }
  }, [user, showAll]);

  const loadInquiries = async () => {
    if (!user) {
      setInquiries([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      console.log("Loading inquiries with user:", {
        userId: user.id,
        isAdminOrOwner,
        showAll
      });
      
      let query = supabase
        .from('support_inquiries')
        .select('*');
      
      // For regular users, only show their own inquiries
      if (!isAdminOrOwner) {
        console.log("Filtering inquiries for regular user:", user.id);
        query = query.eq('user_id', user.id);
      } 
      // For admin/owner showing only open inquiries
      else if (!showAll) {
        console.log("Filtering for open inquiries only (admin/owner)");
        query = query.eq('status', 'open');
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error in Supabase query:", error);
        throw error;
      }
      
      console.log("Inquiries fetched:", data);
      
      // Map the data to match our SupportInquiry type
      const formattedInquiries: SupportInquiry[] = data.map(item => ({
        id: item.id,
        userId: item.user_id,
        userEmail: item.user_email,
        userName: item.user_name,
        subject: item.subject,
        message: item.message,
        createdAt: item.created_at,
        status: item.status as "open" | "closed",
        updatedAt: item.updated_at
      }));
      
      setInquiries(formattedInquiries);
    } catch (error) {
      console.error("Error loading inquiries:", error);
      toast({
        variant: "destructive",
        title: "Error loading inquiries",
        description: "There was a problem loading your inquiries."
      });
      setInquiries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadInquiries();
    setIsRefreshing(false);
    
    toast({
      title: "Refreshed",
      description: "Support inquiries have been refreshed.",
    });
  };

  const handleDeleteClick = (inquiry: SupportInquiry) => {
    setInquiryToDelete(inquiry);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!inquiryToDelete || !isAdminOrOwner) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('support_inquiries')
        .delete()
        .eq('id', inquiryToDelete.id);
      
      if (error) {
        throw error;
      }
      
      // Remove from local state
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
    return status === "open" ? "bg-yellow-500" : "bg-green-500";
  };

  const handleViewInquiry = (inquiryId: string) => {
    navigate(`/support/${inquiryId}`);
  };

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Loading inquiries...</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-end mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
        
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
                  {isAdminOrOwner && (
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
                    View
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
