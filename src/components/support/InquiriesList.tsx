
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { SupportInquiry } from "@/types/support";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface InquiriesListProps {
  showAll?: boolean;
}

export const InquiriesList = ({ showAll = false }: InquiriesListProps) => {
  const [inquiries, setInquiries] = useState<SupportInquiry[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  useEffect(() => {
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

    loadInquiries();
  }, [user, isAdmin, showAll]);

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
              <Button
                variant="outline" 
                size="sm"
                onClick={() => handleViewInquiry(inquiry.id)}
              >
                {inquiry.replies.length > 0 ? `View (${inquiry.replies.length} replies)` : "View"}
              </Button>
            </CardFooter>
          </Card>
        ))
      )}
    </div>
  );
};

