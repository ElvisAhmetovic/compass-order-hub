import { useState, useEffect } from "react";
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
import { Order, OrderComment, OrderStatus, OrderStatusHistory, User, UserRole } from "@/types";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Edit, Save, AlertCircle } from "lucide-react";

// Mock data for demonstration
const mockComments: OrderComment[] = [
  {
    id: "c1",
    order_id: "1",
    user_id: "user1",
    user_name: "Admin User",
    content: "Initial contact made with the client. They're interested in starting next week.",
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
    user_name: "Sales Agent",
    content: "Client requested a detailed quote breakdown before proceeding.",
    created_at: "2025-05-16T09:45:00Z",
    user: {
      full_name: "Sales Agent",
      email: "sales@example.com"
    }
  }
];

interface OrderModalProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  userRole: UserRole;
}

const OrderModal = ({ order, open, onClose, userRole }: OrderModalProps) => {
  const [activeTab, setActiveTab] = useState("details");
  const [newComment, setNewComment] = useState("");
  const [newStatus, setNewStatus] = useState<OrderStatus | "">("");
  const [statusNote, setStatusNote] = useState("");
  const [comments, setComments] = useState<OrderComment[]>(mockComments);
  const [statusHistory, setStatusHistory] = useState<OrderStatusHistory[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState("unassigned");
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editedOrder, setEditedOrder] = useState<Partial<Order>>({});
  
  const { toast } = useToast();
  const { user } = useAuth(); // Get current user from Auth context

  // Fetch available users
  useEffect(() => {
    try {
      const storedUsers = localStorage.getItem("app_users");
      if (storedUsers) {
        setUsers(JSON.parse(storedUsers));
      }
    } catch (error) {
      console.error("Error loading users:", error);
    }
  }, []);

  // Update local state when order prop changes
  useEffect(() => {
    if (order) {
      setCurrentOrder(order);
      setSelectedAssignee(order.assigned_to || "unassigned");
      setEditedOrder({});
      setIsEditing(false);
      
      // Reset form states
      setNewStatus("");
      setStatusNote("");
      setActiveTab("details");
      
      // Load order status history
      const allStatusHistories = JSON.parse(localStorage.getItem("statusHistories") || "{}");
      const orderHistory = allStatusHistories[order.id] || [];
      setStatusHistory(orderHistory);
    }
  }, [order]);

  if (!currentOrder) return null;

  // Check if current user is admin or owner of the order
  const canEdit = userRole === "admin" || currentOrder.created_by === user?.id;
  const isAdmin = userRole === "admin";

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
      "Review": "bg-status-review text-white",
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

  const formatDateTime = (dateString: string) => {
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

  const handleEditChange = (field: string, value: string) => {
    setEditedOrder({
      ...editedOrder,
      [field]: value
    });
  };

  const handleSaveChanges = () => {
    if (Object.keys(editedOrder).length === 0) {
      setIsEditing(false);
      return;
    }

    setIsSubmitting(true);
    
    setTimeout(() => {
      try {
        // Create updated order
        const updatedOrder = {
          ...currentOrder,
          ...editedOrder,
          updated_at: new Date().toISOString()
        };
        
        // Update order in localStorage
        const ordersInStorage = JSON.parse(localStorage.getItem("orders") || "[]");
        const updatedOrders = ordersInStorage.map((o: Order) => 
          o.id === currentOrder.id ? updatedOrder : o
        );
        localStorage.setItem("orders", JSON.stringify(updatedOrders));
        
        // Add edit to history
        const newStatusHistoryItem: OrderStatusHistory = {
          id: `sh${Date.now()}`,
          orderId: currentOrder.id,
          userId: user?.id || "unknown", 
          userName: user?.full_name || user?.email || "Unknown User",
          createdAt: new Date().toISOString(),
          order_id: currentOrder.id,
          status: currentOrder.status,
          changed_by: user?.full_name || user?.email || "Unknown User",
          changed_at: new Date().toISOString(),
          notes: "Order details edited"
        };
        
        const updatedStatusHistory = [newStatusHistoryItem, ...statusHistory];
        setStatusHistory(updatedStatusHistory);
        
        // Save history to localStorage
        const allStatusHistories = JSON.parse(localStorage.getItem("statusHistories") || "{}");
        allStatusHistories[currentOrder.id] = updatedStatusHistory;
        localStorage.setItem("statusHistories", JSON.stringify(allStatusHistories));
        
        // Update current order in state
        setCurrentOrder(updatedOrder);
        setEditedOrder({});
        
        toast({
          title: "Order updated",
          description: "Order details have been successfully updated.",
        });
      } catch (error) {
        console.error("Error updating order:", error);
        toast({
          variant: "destructive",
          title: "Update failed",
          description: "There was a problem updating the order details.",
        });
      } finally {
        setIsSubmitting(false);
        setIsEditing(false);
      }
    }, 500);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      const newCommentObj: OrderComment = {
        id: `c${Date.now()}`,
        order_id: currentOrder.id,
        user_id: user?.id || "unknown",
        user_name: user?.full_name || "Anonymous User",
        content: newComment,
        created_at: new Date().toISOString(),
        user: {
          full_name: user?.full_name || "Anonymous User",
          email: user?.email || "unknown@email.com"
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
    
    setTimeout(() => {
      const newStatusHistoryItem: OrderStatusHistory = {
        id: `sh${Date.now()}`,
        orderId: currentOrder.id,
        userId: user?.id || "unknown", 
        userName: user?.full_name || user?.email || "Unknown User",
        createdAt: new Date().toISOString(),
        order_id: currentOrder.id,
        status: newStatus as OrderStatus,
        changed_by: user?.full_name || user?.email || "Unknown User",
        changed_at: new Date().toISOString(),
        notes: statusNote
      };
      
      // Update status history in local state
      const updatedStatusHistory = [newStatusHistoryItem, ...statusHistory];
      setStatusHistory(updatedStatusHistory);
      
      // Save status history to localStorage
      const allStatusHistories = JSON.parse(localStorage.getItem("statusHistories") || "{}");
      allStatusHistories[currentOrder.id] = updatedStatusHistory;
      localStorage.setItem("statusHistories", JSON.stringify(allStatusHistories));
      
      // Update the order's status in the mock data
      const updatedOrder = { ...currentOrder, status: newStatus, updated_at: new Date().toISOString() };
      setCurrentOrder(updatedOrder);
      
      // Update orders in localStorage for persistence
      const ordersInStorage = JSON.parse(localStorage.getItem("orders") || "[]");
      const updatedOrders = ordersInStorage.map((o: Order) => 
        o.id === currentOrder.id ? { 
          ...o, 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        } : o
      );
      localStorage.setItem("orders", JSON.stringify(updatedOrders));
      
      // If we have order mock data in the code, update that too
      if (typeof window !== "undefined") {
        // This is for demonstration - in a real app, this would be handled by proper state management
        const mockOrdersInWindow = (window as any).mockOrders;
        if (mockOrdersInWindow) {
          const updatedMockOrders = mockOrdersInWindow.map((o: Order) => 
            o.id === currentOrder.id ? { 
              ...o, 
              status: newStatus, 
              updated_at: new Date().toISOString() 
            } : o
          );
          (window as any).mockOrders = updatedMockOrders;
        }
      }
      
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

  const handleAssignOrder = () => {
    if (!selectedAssignee || selectedAssignee === "unassigned") {
      // If "unassigned" is selected, clear the assignment
      const updatedOrder = { 
        ...currentOrder, 
        assigned_to: "",
        assigned_to_name: "",
        updated_at: new Date().toISOString() 
      };
      setCurrentOrder(updatedOrder);
      
      // Update orders in localStorage
      const ordersInStorage = JSON.parse(localStorage.getItem("orders") || "[]");
      const updatedOrders = ordersInStorage.map((o: Order) => 
        o.id === currentOrder.id ? { 
          ...o, 
          assigned_to: "", 
          assigned_to_name: "", 
          updated_at: new Date().toISOString() 
        } : o
      );
      localStorage.setItem("orders", JSON.stringify(updatedOrders));
      
      // Add unassignment to history
      const newStatusHistoryItem: OrderStatusHistory = {
        id: `sh${Date.now()}`,
        orderId: currentOrder.id,
        userId: user?.id || "unknown", 
        userName: user?.full_name || user?.email || "Unknown User",
        createdAt: new Date().toISOString(),
        order_id: currentOrder.id,
        status: currentOrder.status,
        changed_by: user?.full_name || user?.email || "Unknown User",
        changed_at: new Date().toISOString(),
        notes: "Order unassigned"
      };
      
      // Update status history in local state
      const updatedStatusHistory = [newStatusHistoryItem, ...statusHistory];
      setStatusHistory(updatedStatusHistory);
      
      // Save status history to localStorage
      const allStatusHistories = JSON.parse(localStorage.getItem("statusHistories") || "{}");
      allStatusHistories[currentOrder.id] = updatedStatusHistory;
      localStorage.setItem("statusHistories", JSON.stringify(allStatusHistories));
      
      toast({
        title: "Order unassigned",
        description: "Order has been unassigned.",
      });
      return;
    }
    
    if (!selectedAssignee || selectedAssignee === currentOrder.assigned_to) {
      return;
    }
    
    setIsSubmitting(true);
    
    setTimeout(() => {
      // Find the selected user's details
      const assigneeUser = users.find(u => u.id === selectedAssignee);
      const assigneeName = assigneeUser?.full_name || assigneeUser?.email || "Unknown User";
      
      // Update the order's assigned_to in the mock data
      const updatedOrder = { 
        ...currentOrder, 
        assigned_to: selectedAssignee,
        assigned_to_name: assigneeName,
        updated_at: new Date().toISOString() 
      };
      setCurrentOrder(updatedOrder);
      
      // Update orders in localStorage
      const ordersInStorage = JSON.parse(localStorage.getItem("orders") || "[]");
      const updatedOrders = ordersInStorage.map((o: Order) => 
        o.id === currentOrder.id ? { 
          ...o, 
          assigned_to: selectedAssignee, 
          assigned_to_name: assigneeName, 
          updated_at: new Date().toISOString() 
        } : o
      );
      localStorage.setItem("orders", JSON.stringify(updatedOrders));
      
      // Add assignment change to history
      const newStatusHistoryItem: OrderStatusHistory = {
        id: `sh${Date.now()}`,
        orderId: currentOrder.id,
        userId: user?.id || "unknown", 
        userName: user?.full_name || user?.email || "Unknown User",
        createdAt: new Date().toISOString(),
        order_id: currentOrder.id,
        status: currentOrder.status,
        changed_by: user?.full_name || user?.email || "Unknown User",
        changed_at: new Date().toISOString(),
        notes: `Order assigned to ${assigneeName}`
      };
      
      // Update status history in local state
      const updatedStatusHistory = [newStatusHistoryItem, ...statusHistory];
      setStatusHistory(updatedStatusHistory);
      
      // Save status history to localStorage
      const allStatusHistories = JSON.parse(localStorage.getItem("statusHistories") || "{}");
      allStatusHistories[currentOrder.id] = updatedStatusHistory;
      localStorage.setItem("statusHistories", JSON.stringify(allStatusHistories));
      
      setIsSubmitting(false);
      
      toast({
        title: "Order assigned",
        description: `Order has been assigned to ${assigneeName}.`,
      });
    }, 500);
  };

  const getAssigneeName = (userId: string): string => {
    if (!userId) return "Unassigned";
    const assigneeUser = users.find(u => u.id === userId);
    return assigneeUser?.full_name || assigneeUser?.email || "Unknown User";
  };

  // Function to determine which tabs should be visible based on user role
  const getAvailableTabs = () => {
    // Everyone can see details and comments
    const tabs = [
      { value: "details", label: "Details" },
      { value: "comments", label: "Comments" }
    ];
    
    // Only admin users can see history, change status and assign tabs
    if (isAdmin) {
      tabs.push(
        { value: "history", label: "Status History" },
        { value: "change", label: "Change Status" },
        { value: "assign", label: "Assign Order" }
      );
    }
    
    return tabs;
  };

  const availableTabs = getAvailableTabs();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <span>Order: {currentOrder.company_name}</span>
              <Badge className={getStatusColor(currentOrder.status)}>{currentOrder.status}</Badge>
              <Badge className={getPriorityColor(currentOrder.priority)}>{currentOrder.priority}</Badge>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`grid ${isAdmin ? "grid-cols-5" : "grid-cols-2"}`}>
            {availableTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
            ))}
          </TabsList>
          
          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            {!isAdmin && !canEdit && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-md mb-4 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  Only administrators can edit order details. You can view but not modify this information.
                </p>
              </div>
            )}
            
            {canEdit && !isEditing && (
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1"
                >
                  <Edit className="h-4 w-4" />
                  Edit Details
                </Button>
              </div>
            )}
            
            {canEdit && isEditing && (
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedOrder({});
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={handleSaveChanges}
                  disabled={isSubmitting}
                  className="flex items-center gap-1"
                >
                  <Save className="h-4 w-4" />
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-lg mb-2">Company Information</h3>
                <dl className="divide-y divide-gray-200">
                  <div className="py-2 grid grid-cols-3">
                    <dt className="font-medium">Company Name:</dt>
                    <dd className="col-span-2">
                      {isEditing && canEdit ? (
                        <Input 
                          value={editedOrder.company_name !== undefined ? editedOrder.company_name : currentOrder.company_name} 
                          onChange={(e) => handleEditChange('company_name', e.target.value)}
                        />
                      ) : (
                        currentOrder.company_name
                      )}
                    </dd>
                  </div>
                  <div className="py-2 grid grid-cols-3">
                    <dt className="font-medium">Contact Name:</dt>
                    <dd className="col-span-2">
                      {isEditing && canEdit ? (
                        <Input 
                          value={editedOrder.contact_name !== undefined ? editedOrder.contact_name : currentOrder.contact_name} 
                          onChange={(e) => handleEditChange('contact_name', e.target.value)}
                        />
                      ) : (
                        currentOrder.contact_name
                      )}
                    </dd>
                  </div>
                  <div className="py-2 grid grid-cols-3">
                    <dt className="font-medium">Contact Email:</dt>
                    <dd className="col-span-2">
                      {isEditing && canEdit ? (
                        <Input 
                          type="email"
                          value={editedOrder.contact_email !== undefined ? editedOrder.contact_email : currentOrder.contact_email} 
                          onChange={(e) => handleEditChange('contact_email', e.target.value)}
                        />
                      ) : (
                        currentOrder.contact_email
                      )}
                    </dd>
                  </div>
                  <div className="py-2 grid grid-cols-3">
                    <dt className="font-medium">Contact Phone:</dt>
                    <dd className="col-span-2">
                      {isEditing && canEdit ? (
                        <Input 
                          value={editedOrder.contact_phone !== undefined ? editedOrder.contact_phone : currentOrder.contact_phone || ""} 
                          onChange={(e) => handleEditChange('contact_phone', e.target.value)}
                        />
                      ) : (
                        currentOrder.contact_phone || "N/A"
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h3 className="font-medium text-lg mb-2">Order Information</h3>
                <dl className="divide-y divide-gray-200">
                  <div className="py-2 grid grid-cols-3">
                    <dt className="font-medium">Order ID:</dt>
                    <dd className="col-span-2">{currentOrder.id}</dd>
                  </div>
                  <div className="py-2 grid grid-cols-3">
                    <dt className="font-medium">Price:</dt>
                    <dd className="col-span-2">{formatCurrency(currentOrder.price)}</dd>
                  </div>
                  <div className="py-2 grid grid-cols-3">
                    <dt className="font-medium">Created:</dt>
                    <dd className="col-span-2">{formatDateTime(currentOrder.created_at)}</dd>
                  </div>
                  <div className="py-2 grid grid-cols-3">
                    <dt className="font-medium">Last Updated:</dt>
                    <dd className="col-span-2">{formatDateTime(currentOrder.updated_at)}</dd>
                  </div>
                  <div className="py-2 grid grid-cols-3">
                    <dt className="font-medium">Assigned To:</dt>
                    <dd className="col-span-2">
                      {currentOrder.assigned_to 
                        ? (currentOrder.assigned_to_name || getAssigneeName(currentOrder.assigned_to))
                        : "Unassigned"}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-lg mb-2">Description</h3>
              {isEditing && canEdit ? (
                <Textarea 
                  className="min-h-[100px]" 
                  value={editedOrder.description !== undefined ? editedOrder.description : currentOrder.description}
                  onChange={(e) => handleEditChange('description', e.target.value)}
                />
              ) : (
                <div className="bg-muted p-4 rounded-md">
                  {currentOrder.description}
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Status History Tab (admin only) */}
          <TabsContent value="history">
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Status History</h3>
              {statusHistory.length > 0 ? (
                <div className="space-y-4">
                  {statusHistory.map((history) => (
                    <div key={history.id} className="border rounded-md p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge className={getStatusColor(history.status)}>{history.status}</Badge>
                        <span className="text-sm text-muted-foreground">{formatDateTime(history.changed_at)}</span>
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
                        <span className="text-sm text-muted-foreground">{formatDateTime(comment.created_at)}</span>
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
          
          {/* Change Status Tab (admin only) */}
          {isAdmin && (
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
                        <SelectItem value="Review">Review</SelectItem>
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
          )}
          
          {/* Assign Order Tab (admin only) */}
          {isAdmin && (
            <TabsContent value="assign">
              <div className="space-y-4">
                <h3 className="font-medium text-lg">Assign Order</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="assignee-select" className="text-sm font-medium">Assign To</label>
                    <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    onClick={handleAssignOrder} 
                    disabled={isSubmitting || (selectedAssignee !== "unassigned" && selectedAssignee === currentOrder.assigned_to)}
                  >
                    {isSubmitting ? "Assigning..." : "Assign Order"}
                  </Button>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderModal;
