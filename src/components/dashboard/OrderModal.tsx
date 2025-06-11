
import { useState } from "react";
import { X, ExternalLink, MessageSquare, User, Calendar, DollarSign, Building2, Mail, Phone, MapPin, Clock } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Order, UserRole } from "@/types";
import { formatDate } from "@/lib/utils";
import { formatCurrency } from "@/utils/currencyUtils";
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

  if (!order) return null;

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <h2 className="text-xl font-semibold">{order.company_name}</h2>
              <Badge className={getPriorityColor(order.priority)}>
                {order.priority}
              </Badge>
            </div>
            <MultiStatusBadges order={order} onRefresh={handleRefresh} />
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="details" className="h-full flex flex-col">
            <TabsList className="mx-6">
              <TabsTrigger value="details">Order Details</TabsTrigger>
              <TabsTrigger value="activity">Activity Timeline</TabsTrigger>
              <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="flex-1 overflow-auto px-6 pb-6">
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
                      <p className="text-sm">{order.company_name}</p>
                    </div>
                    
                    {order.company_address && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Address
                        </label>
                        <p className="text-sm">{order.company_address}</p>
                      </div>
                    )}
                    
                    {order.contact_email && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          Email
                        </label>
                        <p className="text-sm">{order.contact_email}</p>
                      </div>
                    )}
                    
                    {order.contact_phone && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          Phone
                        </label>
                        <p className="text-sm">{order.contact_phone}</p>
                      </div>
                    )}
                    
                    {order.company_link && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />
                          Website
                        </label>
                        <a 
                          href={order.company_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          {order.company_link}
                        </a>
                      </div>
                    )}
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
                      <p className="text-sm font-semibold">{formatCurrency(order.price || 0)}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Currency</label>
                      <p className="text-sm">{order.currency || 'EUR'}</p>
                    </div>
                    
                    {order.description && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Description</label>
                        <p className="text-sm">{order.description}</p>
                      </div>
                    )}
                    
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
