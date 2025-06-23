
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Order, UserRole } from "@/types";
import CompanyInfoSection from "@/components/dashboard/OrderEditForm/CompanyInfoSection";
import OrderDetailsSection from "@/components/dashboard/OrderEditForm/OrderDetailsSection";
import EditModeHeader from "@/components/dashboard/OrderEditForm/EditModeHeader";
import { useOrderEdit } from "@/components/dashboard/OrderEditForm/useOrderEdit";
import { SelectedInventoryItem } from "@/components/dashboard/InventoryItemsSelector";

interface OrderModalProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  userRole: UserRole;
}

const OrderModal = ({ order, open, onClose, userRole }: OrderModalProps) => {
  const [selectedInventoryItems, setSelectedInventoryItems] = useState<SelectedInventoryItem[]>([]);
  
  const {
    isEditing,
    editedOrder,
    isSaving,
    validationErrors,
    hasErrors,
    internalNotes,
    handleEdit,
    handleFieldChange,
    handleInternalNotesChange,
    handleSave,
    handleCancel
  } = useOrderEdit(order, () => {
    // Refresh logic here if needed
    window.dispatchEvent(new CustomEvent('orderStatusChanged'));
  }, selectedInventoryItems, setSelectedInventoryItems);

  const isAdmin = userRole === "admin";
  const isAgent = userRole === "agent";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{order?.company_name}</DialogTitle>
          <DialogDescription>
            {order?.description || "No description provided"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="details" className="h-full">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              {isAdmin && <TabsTrigger value="history">History</TabsTrigger>}
            </TabsList>
            
            <TabsContent value="details" className="space-y-6 mt-6">
              <EditModeHeader
                isEditing={isEditing}
                isSaving={isSaving}
                hasErrors={hasErrors}
                onEdit={handleEdit}
                onSave={handleSave}
                onCancel={handleCancel}
                userRole={userRole}
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CompanyInfoSection
                  order={order}
                  data={editedOrder}
                  errors={validationErrors}
                  isEditing={isEditing}
                  onChange={handleFieldChange}
                />
                
                <OrderDetailsSection
                  order={order}
                  data={editedOrder}
                  errors={validationErrors}
                  isEditing={isEditing}
                  onChange={handleFieldChange}
                  selectedInventoryItems={selectedInventoryItems}
                  onInventoryItemsChange={setSelectedInventoryItems}
                  internalNotes={internalNotes}
                  onInternalNotesChange={handleInternalNotesChange}
                />
              </div>
            </TabsContent>

            {isAdmin && (
              <TabsContent value="history" className="space-y-6 mt-6">
                <div className="p-4 text-center text-muted-foreground">
                  Order history feature coming soon
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderModal;
