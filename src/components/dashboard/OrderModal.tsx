
import { useState } from "react";
import { X, ExternalLink, MessageSquare, User, Calendar, DollarSign, Building2, Mail, Phone, MapPin, Clock, Edit, Save } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Order, UserRole, OrderPriority } from "@/types";
import { formatDate } from "@/lib/utils";
import { formatCurrency } from "@/utils/currencyUtils";
import { OrderService } from "@/services/orderService";
import { useToast } from "@/hooks/use-toast";
import OrderCollaboration from "./OrderCollaboration";
import OrderActivityTimeline from "./OrderActivityTimeline";
import MultiStatusBadges from "./MultiStatusBadges";

interface OrderModalProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  userRole: UserRole;
}

const OrderModal = ({ order, open, onClose, userRole }: OrderModalProps) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedOrder, setEditedOrder] = useState<Partial<Order>>({});
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  if (!order) return null;

  const isAdmin = userRole === "admin";

  const handleEdit = () => {
    setIsEditing(true);
    setEditedOrder({
      company_name: order.company_name,
      company_address: order.company_address || "",
      contact_email: order.contact_email || "",
      contact_phone: order.contact_phone || "",
      company_link: order.company_link || "",
      description: order.description || "",
      price: order.price || 0,
      currency: order.currency || "EUR",
      priority: (order.priority || "medium") as OrderPriority
    });
  };

  const handleSave = async () => {
    if (!editedOrder.company_name?.trim()) {
      toast({
        title: "Validation Error",
        description: "Company name is required.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      await OrderService.updateOrder(order.id, editedOrder);
      
      toast({
        title: "Order Updated",
        description: "Order details have been successfully updated.",
      });
      
      setIsEditing(false);
      setRefreshTrigger(prev => prev + 1);
      window.dispatchEvent(new CustomEvent('orderStatusChanged'));
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Error",
        description: "Failed to update order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedOrder({});
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const getPriorityColor = (priority: string) => {
    const priorityClasses = {
      "low": "bg-priority-low text-white",
      "medium": "bg-priority-medium text-white", 
      "high": "bg-priority-high text-white",
      "urgent": "bg-priority-urgent text-white",
    };
    return priorityClasses[priority.toLowerCase()] || "bg-gray-500 text-white";
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <h2 className="text-xl font-semibold">{order.company_name}</h2>
              <Badge className={getPriorityColor(order.priority || "medium")}>
                {order.priority || "medium"}
              </Badge>
            </div>
            <MultiStatusBadges order={order} onRefresh={handleRefresh} />
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && !isEditing && (
              <Button variant="outline" size="icon" onClick={handleEdit}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="details" className="h-full flex flex-col">
            <TabsList className="mx-6">
              <TabsTrigger value="details">Order Details</TabsTrigger>
              <TabsTrigger value="activity">Activity Timeline</TabsTrigger>
              <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="flex-1 overflow-auto px-6 pb-6">
              {isEditing && (
                <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-800">Editing Mode</p>
                    <p className="text-sm text-blue-600">Make your changes and click Save to update the order.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                      <Save className="h-4 w-4 mr-1" />
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancel} disabled={isSaving}>
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Company Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Company Information
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Company Name</label>
                      {isEditing ? (
                        <Input
                          value={editedOrder.company_name || ""}
                          onChange={(e) => setEditedOrder(prev => ({ ...prev, company_name: e.target.value }))}
                          placeholder="Company name"
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm">{order.company_name}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Address
                      </label>
                      {isEditing ? (
                        <Textarea
                          value={editedOrder.company_address || ""}
                          onChange={(e) => setEditedOrder(prev => ({ ...prev, company_address: e.target.value }))}
                          placeholder="Company address"
                          className="mt-1"
                          rows={2}
                        />
                      ) : (
                        <p className="text-sm">{order.company_address || "Not provided"}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        Email
                      </label>
                      {isEditing ? (
                        <Input
                          type="email"
                          value={editedOrder.contact_email || ""}
                          onChange={(e) => setEditedOrder(prev => ({ ...prev, contact_email: e.target.value }))}
                          placeholder="Contact email"
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm">{order.contact_email || "Not provided"}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        Phone
                      </label>
                      {isEditing ? (
                        <Input
                          value={editedOrder.contact_phone || ""}
                          onChange={(e) => setEditedOrder(prev => ({ ...prev, contact_phone: e.target.value }))}
                          placeholder="Contact phone"
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm">{order.contact_phone || "Not provided"}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />
                        Website
                      </label>
                      {isEditing ? (
                        <Input
                          value={editedOrder.company_link || ""}
                          onChange={(e) => setEditedOrder(prev => ({ ...prev, company_link: e.target.value }))}
                          placeholder="https://company-website.com"
                          className="mt-1"
                        />
                      ) : (
                        order.company_link ? (
                          <a 
                            href={order.company_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            {order.company_link}
                          </a>
                        ) : (
                          <p className="text-sm">Not provided</p>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Order Details
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        Price
                      </label>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editedOrder.price || 0}
                          onChange={(e) => setEditedOrder(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                          placeholder="0.00"
                          className="mt-1"
                        />
                      ) : (
                        <p className="text-sm font-semibold">{formatCurrency(order.price || 0)}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Currency</label>
                      {isEditing ? (
                        <Select value={editedOrder.currency || "EUR"} onValueChange={(value) => setEditedOrder(prev => ({ ...prev, currency: value }))}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="CHF">CHF</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm">{order.currency || 'EUR'}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Priority</label>
                      {isEditing ? (
                        <Select 
                          value={editedOrder.priority || "medium"} 
                          onValueChange={(value) => setEditedOrder(prev => ({ ...prev, priority: value as OrderPriority }))}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={getPriorityColor(order.priority || "medium")}>
                          {order.priority || "medium"}
                        </Badge>
                      )}
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Description</label>
                      {isEditing ? (
                        <Textarea
                          value={editedOrder.description || ""}
                          onChange={(e) => setEditedOrder(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Order description"
                          className="mt-1"
                          rows={3}
                        />
                      ) : (
                        <p className="text-sm">{order.description || "No description provided"}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Assigned To
                      </label>
                      <p className="text-sm">{order.assigned_to_name || "Unassigned"}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Created
                      </label>
                      <p className="text-sm">{formatDate(order.created_at)}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Last Updated
                      </label>
                      <p className="text-sm">{formatDate(order.updated_at || order.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="flex-1 overflow-auto px-6 pb-6">
              <OrderActivityTimeline orderId={order.id} />
            </TabsContent>

            <TabsContent value="collaboration" className="flex-1 overflow-auto px-6 pb-6">
              <OrderCollaboration orderId={order.id} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderModal;
