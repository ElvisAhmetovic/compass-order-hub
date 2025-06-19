
import { useState, useEffect } from "react";
import { X, Edit, Building2, MessageSquare } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Order, UserRole } from "@/types";
import OrderCollaboration from "./OrderCollaboration";
import OrderActivityTimeline from "./OrderActivityTimeline";
import MultiStatusBadges from "./MultiStatusBadges";
import CompanyInfoSection from "./OrderEditForm/CompanyInfoSection";
import OrderDetailsSection from "./OrderEditForm/OrderDetailsSection";
import EditModeHeader from "./OrderEditForm/EditModeHeader";
import { useOrderEdit } from "./OrderEditForm/useOrderEdit";
import { SelectedInventoryItem } from "./InventoryItemsSelector";

interface OrderModalProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  userRole: UserRole;
}

const OrderModal = ({ order, open, onClose, userRole }: OrderModalProps) => {
  // ALL HOOKS MUST BE CALLED FIRST - before any early returns or conditional logic
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedInventoryItems, setSelectedInventoryItems] = useState<SelectedInventoryItem[]>([]);
  const [inventoryInitialized, setInventoryInitialized] = useState(false);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    setInventoryInitialized(false); // Reset initialization flag when refreshing
  };

  // Call useOrderEdit hook BEFORE any conditional returns
  const {
    isEditing,
    editedOrder,
    isSaving,
    validationErrors,
    hasErrors,
    handleEdit,
    handleFieldChange,
    handleSave,
    handleCancel
  } = useOrderEdit(order, handleRefresh);

  // Initialize inventory items from order data only once when order changes
  useEffect(() => {
    if (order?.inventory_items && !inventoryInitialized) {
      try {
        const parsedItems = JSON.parse(order.inventory_items);
        if (Array.isArray(parsedItems)) {
          console.log('Setting initial inventory items:', parsedItems);
          setSelectedInventoryItems(parsedItems);
        }
      } catch (error) {
        console.error('Error parsing inventory items:', error);
        setSelectedInventoryItems([]);
      }
      setInventoryInitialized(true);
    } else if (!order?.inventory_items && !inventoryInitialized) {
      setSelectedInventoryItems([]);
      setInventoryInitialized(true);
    }
  }, [order?.id, inventoryInitialized]);

  // Reset initialization when order changes
  useEffect(() => {
    setInventoryInitialized(false);
  }, [order?.id]);

  // Handle inventory items changes with proper state update
  const handleInventoryItemsChange = (items: SelectedInventoryItem[]) => {
    console.log('Inventory items changed:', items);
    setSelectedInventoryItems(items);
    // Update the form data immediately
    handleFieldChange('inventory_items', JSON.stringify(items));
  };

  // Enhanced save function that includes inventory items
  const handleSaveWithInventory = async () => {
    console.log('Saving with inventory items:', selectedInventoryItems);
    // Update the inventory items in the edited order before saving
    handleFieldChange('inventory_items', JSON.stringify(selectedInventoryItems));
    
    // Small delay to ensure state is updated
    setTimeout(async () => {
      await handleSave();
    }, 100);
  };

  // Reset inventory when canceling edit
  const handleCancelEdit = () => {
    handleCancel();
    setInventoryInitialized(false); // This will trigger re-initialization from order data
  };

  // NOW we can do early returns after all hooks are called
  if (!order) return null;

  const isAdmin = userRole === "admin";

  const getPriorityColor = (priority: string) => {
    const priorityClasses = {
      "low": "bg-priority-low text-white",
      "medium": "bg-priority-medium text-white", 
      "high": "bg-priority-high text-white",
      "urgent": "bg-priority-urgent text-white",
    };
    return priorityClasses[priority.toLowerCase()] || "bg-gray-500 text-white";
  };

  const formatPriorityDisplay = (priority: string) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <h2 className="text-xl font-semibold">{order.company_name}</h2>
              <Badge className={getPriorityColor(order.priority || "medium")}>
                {formatPriorityDisplay(order.priority || "medium")}
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
                <EditModeHeader
                  isSaving={isSaving}
                  hasErrors={hasErrors}
                  onSave={handleSaveWithInventory}
                  onCancel={handleCancelEdit}
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Company Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Company Information
                  </h3>
                  
                  <CompanyInfoSection
                    data={isEditing ? editedOrder : {
                      company_name: order.company_name,
                      company_address: order.company_address || "",
                      contact_email: order.contact_email || "",
                      contact_phone: order.contact_phone || "",
                      company_link: order.company_link || "",
                      description: order.description || "",
                      price: order.price || 0,
                      currency: order.currency || "EUR",
                      priority: order.priority || "medium"
                    }}
                    errors={validationErrors}
                    isEditing={isEditing}
                    onChange={handleFieldChange}
                  />
                </div>

                {/* Order Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Order Details
                  </h3>
                  
                  <OrderDetailsSection
                    order={order}
                    data={isEditing ? {
                      ...editedOrder,
                      assigned_to: editedOrder.assigned_to
                    } : {
                      company_name: order.company_name,
                      company_address: order.company_address || "",
                      contact_email: order.contact_email || "",
                      contact_phone: order.contact_phone || "",
                      company_link: order.company_link || "",
                      description: order.description || "",
                      price: order.price || 0,
                      currency: order.currency || "EUR",
                      priority: order.priority || "medium",
                      assigned_to: order.assigned_to || ""
                    }}
                    errors={validationErrors}
                    isEditing={isEditing}
                    onChange={handleFieldChange}
                    selectedInventoryItems={selectedInventoryItems}
                    onInventoryItemsChange={handleInventoryItemsChange}
                  />
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
