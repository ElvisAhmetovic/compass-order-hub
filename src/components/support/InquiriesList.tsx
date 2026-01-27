import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
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
import { supabase } from "@/integrations/supabase/client";

interface SupportInquiry {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  subject: string;
  message: string;
  created_at: string;
  status: "open" | "replied" | "closed";
  reply_count?: number;
}

interface InquiriesListProps {
  showAll?: boolean;
}

export const InquiriesList = ({ showAll = false }: InquiriesListProps) => {
  const [inquiries, setInquiries] = useState<SupportInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inquiryToDelete, setInquiryToDelete] = useState<SupportInquiry | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    loadInquiries();
  }, [user, isAdmin, showAll]);

  // Real-time subscription for admins to auto-refresh when new inquiries arrive
  useEffect(() => {
    if (!user || !isAdmin) return;

    const channel = supabase
      .channel('admin-support-inquiries-list')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'support_inquiries'
      }, () => {
        loadInquiries();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'support_replies'
      }, () => {
        loadInquiries();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user, isAdmin]);

  const loadInquiries = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('support_inquiries')
        .select(`
          id,
          user_id,
          user_email,
          user_name,
          subject,
          message,
          created_at,
          status
        `)
        .order('created_at', { ascending: false });

      // Apply filters based on user role and view
      if (!isAdmin) {
        // Non-admin users only see their own inquiries
        query = query.eq('user_id', user.id);
      } else if (!showAll) {
        // Admin in "open" tab - only show open inquiries
        query = query.eq('status', 'open');
      }
      // Admin with showAll=true sees all inquiries (no filter)

      const { data, error } = await query;

      if (error) throw error;

      // Get reply counts for each inquiry
      const inquiriesWithCounts = await Promise.all(
        (data || []).map(async (inquiry) => {
          const { count } = await supabase
            .from('support_replies')
            .select('*', { count: 'exact', head: true })
            .eq('inquiry_id', inquiry.id);
          
          return {
            ...inquiry,
            status: inquiry.status as "open" | "replied" | "closed",
            reply_count: count || 0
          };
        })
      );

      setInquiries(inquiriesWithCounts);
    } catch (error) {
      console.error("Error loading inquiries:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load support inquiries.",
      });
      setInquiries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (inquiry: SupportInquiry) => {
    setInquiryToDelete(inquiry);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!inquiryToDelete) return;
    
    setIsDeleting(true);
    try {
      // Delete replies first (foreign key constraint)
      await supabase
        .from('support_replies')
        .delete()
        .eq('inquiry_id', inquiryToDelete.id);

      // Then delete the inquiry
      const { error } = await supabase
        .from('support_inquiries')
        .delete()
        .eq('id', inquiryToDelete.id);

      if (error) throw error;
      
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

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Loading inquiries...</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {inquiries.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No inquiries found.</p>
          </div>
        ) : (
          inquiries.map((inquiry) => (
            <Card key={inquiry.id} className="mb-4">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-semibold">{inquiry.subject}</CardTitle>
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
                <p className="text-sm whitespace-pre-wrap line-clamp-3">{inquiry.message}</p>
              </CardContent>
              <CardFooter className="flex justify-between items-center pt-2">
                <span className="text-xs text-muted-foreground">
                  {format(new Date(inquiry.created_at), "PPpp")}
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
                    {(inquiry.reply_count || 0) > 0 ? `View (${inquiry.reply_count} replies)` : "View"}
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
              <div className="mt-4 p-3 bg-muted rounded-md">
                <p className="font-medium">{inquiryToDelete?.subject}</p>
                <p className="text-xs text-muted-foreground mt-1">From: {inquiryToDelete?.user_name}</p>
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
