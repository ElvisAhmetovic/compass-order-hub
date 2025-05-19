import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Order, OrderComment, OrderStatus, OrderStatusHistory } from "@/types";

// Mock data for demonstration
const mockComments: OrderComment[] = [
  {
    id: "c1",
    order_id: "1",
    user_id: "user1",
    comment: "Initial contact made with the client. They're interested in starting next week.",
    created_at: "2025-05-15T11:30:00Z",
    user: {
      full_name: "Admin User",
      email: "admin@example.com"
    }
  },
  {
    id: "c2",
    order_id: "1",
    user_id: "user2",
    comment: "Client requested a detailed quote breakdown before proceeding.",
    created_at: "2025-05-16T09:45:00Z",
    user: {
      full_name: "Sales Agent",
      email: "sales@example.com"
    }
  }
];

const mockStatusHistory: OrderStatusHistory[] = [
  {
    id: "sh1",
    order_id: "1",
    status: "Created",
    changed_by: "user1",
    changed_at: "2025-05-15T10:30:00Z",
    notes: "Order created in the system"
  }
];

interface OrderModalProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
}

const OrderModal = ({ order, open, onClose }: OrderModalProps) => {
  const [activeTab, setActiveTab] = useState("details");
  const [newComment, setNewComment] = useState("");
  const [newStatus, setNewStatus] = useState<OrderStatus | "">("");
  const [statusNote, setStatusNote] = useState("");
  const [comments, setComments] = useState<OrderComment[]>(mockComments);
  const [statusHistory, setStatusHistory] = useState<OrderStatusHistory[]>(mockStatusHistory);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();

  if (!order) return null;

  const getStatusColor = (status: OrderStatus) => {
    const statusClasses = {
      "Created": "bg-status-created text-white",
      "In Progress": "bg-status-inprogress text-white",
      "Complaint": "bg-status-complaint text-white",
      "Invoice Sent": "bg-status-invoicesent text-white",
      "Invoice Paid": "bg-status-invoicepaid text-white",
      "Resolved": "bg-status-resolved text-white",
      "Cancelled": "bg-status-cancelled text-white",
      "Deleted": "bg-status-deleted text-white",
    };
    return statusClasses[status] || "bg-gray-500 text-white";
  };

  const getPriorityColor = (priority: string) => {
    const priorityClasses = {
      "Low": "bg-priority-low text-white",
      "Medium": "bg-priority-medium text-white",
      "High": "bg-priority-high text-white",
      "Urgent": "bg-priority-urgent text-white",
    };
    return priorityClasses[priority] || "bg-gray-500 text-white";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      const newCommentObj: OrderComment = {
        id: `c${Date.now()}`,
        order_id: order.id,
        user_id: "currentUser", // This would come from auth context in a real app
        comment: newComment,
        created_at: new Date().toISOString(),
        user: {
          full_name: "Current User", // This would come from auth context in a real app
          email: "current@example.com"
        }
      };
      
      setComments([newCommentObj, ...comments]);
      setNewComment("");
      setIsSubmitting(false);
      
      toast({
        title: "Comment added",
        description: "Your comment has been added to this order.",
      });
    }, 500);
  };

  const handleStatusChange = () => {
    if (!newStatus) return;
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      const newStatusHistoryItem: OrderStatusHistory = {
        id: `sh${Date.now()}`,
        order_id: order.id,
        status: newStatus,
        changed_by: "currentUser", // This would come from auth context in a real app
        changed_at: new Date().toISOString(),
        notes: statusNote
      };
      
      setStatusHistory([newStatusHistoryItem, ...statusHistory]);
      // In a real app, we would also update the order's status
      setNewStatus("");
      setStatusNote("");
      setIsSubmitting(false);
      
      toast({
        title: "Status updated",
        description: `Order status changed to "${newStatus}".`,
      });
      
      // Switch to the status history tab
      setActiveTab("history");
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <span>Order: {order.company_name}</span>
              <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
              <Badge className={getPriorityColor(order.priority)}>{order.priority}</Badge>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="history">Status History</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="change">Change Status</TabsTrigger>
          </TabsList>
          
          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-lg mb-2">Company Information</h3>
                <dl className="divide-y divide-gray-200">
                  <div className="py-2 grid grid-cols-3">
                    <dt className="font-medium">Company Name:</dt>
                    <dd className="col-span-2">{order.company_name}</dd>
                  </div>
                  <div className="py-2 grid grid-cols-3">
                    <dt className="font-medium">Contact Name:</dt>
                    <dd className="col-span-2">{order.contact_name}</dd>
                  </div>
                  <div className="py-2 grid grid-cols-3">
                    <dt className="font-medium">Contact Email:</dt>
                    <dd className="col-span-2">{order.contact_email}</dd>
                  </div>
                  {order.contact_phone && (
                    <div className="py-2 grid grid-cols-3">
                      <dt className="font-medium">Contact Phone:</dt>
                      <dd className="col-span-2">{order.contact_phone}</dd>
                    </div>
                  )}
                </dl>
              </div>
              
              <div>
                <h3 className="font-medium text-lg mb-2">Order Information</h3>
                <dl className="divide-y divide-gray-200">
                  <div className="py-2 grid grid-cols-3">
                    <dt className="font-medium">Order ID:</dt>
                    <dd className="col-span-2">{order.id}</dd>
                  </div>
                  <div className="py-2 grid grid-cols-3">
                    <dt className="font-medium">Price:</dt>
                    <dd className="col-span-2">{formatCurrency(order.price)}</dd>
                  </div>
                  <div className="py-2 grid grid-cols-3">
                    <dt className="font-medium">Created:</dt>
                    <dd className="col-span-2">{formatDate(order.created_at)}</dd>
                  </div>
                  <div className="py-2 grid grid-cols-3">
                    <dt className="font-medium">Last Updated:</dt>
                    <dd className="col-span-2">{formatDate(order.updated_at)}</dd>
                  </div>
                  {order.assigned_to && (
                    <div className="py-2 grid grid-cols-3">
                      <dt className="font-medium">Assigned To:</dt>
                      <dd className="col-span-2">{order.assigned_to}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-lg mb-2">Description</h3>
              <div className="bg-muted p-4 rounded-md">
                {order.description}
              </div>
            </div>
          </TabsContent>
          
          {/* Status History Tab */}
          <TabsContent value="history">
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Status History</h3>
              {statusHistory.length > 0 ? (
                <div className="space-y-4">
                  {statusHistory.map((history) => (
                    <div key={history.id} className="border rounded-md p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge className={getStatusColor(history.status)}>{history.status}</Badge>
                        <span className="text-sm text-muted-foreground">{formatDate(history.changed_at)}</span>
                      </div>
                      {history.notes && (
                        <p className="text-sm">{history.notes}</p>
                      )}
                      <p className="text-xs text-muted-foreground">Changed by: {history.changed_by}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No status history available.</p>
              )}
            </div>
          </TabsContent>
          
          {/* Comments Tab */}
          <TabsContent value="comments">
            <div className="space-y-4">
              <div className="space-y-4">
                <Textarea 
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[100px]"
                />
                <Button 
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || isSubmitting}
                >
                  {isSubmitting ? "Adding..." : "Add Comment"}
                </Button>
              </div>
              
              <h3 className="font-medium text-lg">Comments</h3>
              {comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="border rounded-md p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{comment.user?.full_name || comment.user?.email}</span>
                        <span className="text-sm text-muted-foreground">{formatDate(comment.created_at)}</span>
                      </div>
                      <p>{comment.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No comments yet.</p>
              )}
            </div>
          </TabsContent>
          
          {/* Change Status Tab */}
          <TabsContent value="change">
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Change Order Status</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="status-select" className="text-sm font-medium">New Status</label>
                  <Select value={newStatus} onValueChange={(value) => setNewStatus(value as OrderStatus)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Created">Created</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Complaint">Complaint</SelectItem>
                      <SelectItem value="Invoice Sent">Invoice Sent</SelectItem>
                      <SelectItem value="Invoice Paid">Invoice Paid</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                      <SelectItem value="Deleted">Deleted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="status-note" className="text-sm font-medium">Status Note (Optional)</label>
                  <Textarea 
                    id="status-note"
                    placeholder="Add a note explaining the status change..."
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                  />
                </div>
                
                <Button 
                  onClick={handleStatusChange} 
                  disabled={!newStatus || isSubmitting}
                >
                  {isSubmitting ? "Updating..." : "Update Status"}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderModal;
