
import { useState, useCallback } from "react";
import { Order, OrderPriority } from "@/types";
import { OrderService } from "@/services/orderService";
import { useToast } from "@/hooks/use-toast";
import { OrderFormData, ValidationErrors, validateOrderForm } from "./validation";
import { SelectedInventoryItem } from "../InventoryItemsSelector";
import { supabase } from "@/integrations/supabase/client";

interface ExtendedOrderFormData extends OrderFormData {
  assigned_to?: string;
  internal_notes?: string;
  description?: string;
  client_visible_update?: string;
}

interface UseOrderEditProps {
  order: Order | null;
  onRefresh: () => void;
  selectedInventoryItems?: SelectedInventoryItem[];
  onInventoryItemsChange?: (items: SelectedInventoryItem[]) => void;
}

export const useOrderEdit = (
  order: Order | null, 
  onRefresh: () => void,
  selectedInventoryItems: SelectedInventoryItem[] = [],
  onInventoryItemsChange: (items: SelectedInventoryItem[]) => void = () => {}
) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedOrder, setEditedOrder] = useState<ExtendedOrderFormData>({
    company_name: "",
    company_address: "",
    contact_email: "",
    contact_phone: "",
    company_link: "",
    price: 0,
    currency: "EUR",
    priority: "medium",
    assigned_to: "",
    internal_notes: "",
    description: "",
    client_visible_update: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const { toast } = useToast();

  const handleEdit = useCallback(() => {
    if (!order) return;
    
    // Initialize form data with current order data, including internal notes and description
    const safeOrderData: ExtendedOrderFormData = {
      company_name: order.company_name || "",
      company_address: order.company_address || "",
      contact_email: order.contact_email || "",
      contact_phone: order.contact_phone || "",
      company_link: order.company_link || "",
      price: order.price || 0,
      currency: order.currency || "EUR",
      priority: (order.priority || "medium"),
      assigned_to: order.assigned_to || "",
      internal_notes: order.internal_notes || "",
      description: order.description || "",
      client_visible_update: order.client_visible_update || ""
    };
    
    console.log('Starting edit mode with safe data:', safeOrderData);
    
    setIsEditing(true);
    setEditedOrder(safeOrderData);
    setValidationErrors({});
  }, [order]);

  const handleFieldChange = useCallback((field: keyof ExtendedOrderFormData, value: string | number) => {
    console.log(`Updating field ${field} with value:`, value);
    
    // Ensure we never set undefined or null values
    const safeValue = value === null || value === undefined ? 
      (typeof value === 'number' ? 0 : "") : value;
    
    setEditedOrder(prev => {
      const newData = { ...prev, [field]: safeValue };
      console.log('Updated form data:', newData);
      return newData;
    });
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[field as keyof ValidationErrors]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof ValidationErrors];
        return newErrors;
      });
    }
  }, [validationErrors]);

  const handleSave = useCallback(async () => {
    console.log('=== HANDLE SAVE CALLED ===');
    console.log('Order exists:', !!order);
    
    if (!order) return;
    
    console.log('Attempting to save order with data:', editedOrder);
    console.log('Selected inventory items:', selectedInventoryItems);
    
    const errors = validateOrderForm(editedOrder);
    
    // Only block save if there are critical errors
    const criticalErrors = Object.keys(errors).filter(key => 
      key === 'company_name' // Only company name is truly critical
    );
    
    if (criticalErrors.length > 0) {
      setValidationErrors(errors);
      toast({
        title: "Validation Error",
        description: "Company name is required.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    setValidationErrors({}); // Clear all errors if we're proceeding
    
    try {
      // Prepare update data including internal notes, description, and client visible update
      const updateData: Partial<Order> = {
        company_name: editedOrder.company_name || order.company_name || "",
        company_address: editedOrder.company_address || "",
        contact_email: editedOrder.contact_email || "",
        contact_phone: editedOrder.contact_phone || "",
        company_link: editedOrder.company_link || "",
        price: editedOrder.price !== undefined ? editedOrder.price : 0,
        currency: editedOrder.currency || "EUR",
        priority: editedOrder.priority as OrderPriority || "medium",
        internal_notes: editedOrder.internal_notes || "",
        description: editedOrder.description || "",
        client_visible_update: editedOrder.client_visible_update || ""
      };

      // Handle inventory items
      if (selectedInventoryItems.length > 0) {
        updateData.inventory_items = JSON.stringify(selectedInventoryItems);
        console.log('Saving inventory items to database:', updateData.inventory_items);
      } else {
        updateData.inventory_items = null;
        console.log('Clearing inventory items from database');
      }

      // Handle assignment change
      if (editedOrder.assigned_to !== order.assigned_to) {
        if (editedOrder.assigned_to && editedOrder.assigned_to.trim()) {
          const options = await import('@/services/searchService').then(m => m.SearchService.getFilterOptions());
          const assignedUser = options.assignedUsers.find(u => u.id === editedOrder.assigned_to);
          
          updateData.assigned_to = editedOrder.assigned_to;
          updateData.assigned_to_name = assignedUser?.name || 'Unknown User';
        } else {
          updateData.assigned_to = null;
          updateData.assigned_to_name = null;
        }
      }
      
      console.log('=== EDIT FORM DEBUG ===');
      console.log('Order ID:', order.id);
      console.log('Sending update data to API:', updateData);
      
      await OrderService.updateOrder(order.id, updateData);
      
      toast({
        title: "Order Updated",
        description: "Order details, description, and internal notes have been successfully updated.",
      });
      
      console.log('Order updated successfully via edit form');

      // Send order update notification to team
      try {
        const { NOTIFICATION_EMAIL_LIST } = await import('@/constants/notificationEmails');
        const session = await supabase.auth.getSession();
        
        console.log('Sending order update notification emails...');
        
        const response = await fetch(
          `https://fjybmlugiqmiggsdrkiq.supabase.co/functions/v1/send-order-confirmation`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.data.session?.access_token}`,
            },
            body: JSON.stringify({
              orderData: {
                ...updateData,
                id: order.id,
                created_at: order.created_at,
                isUpdate: true
              },
              emails: [...NOTIFICATION_EMAIL_LIST],
              assignedToName: updateData.assigned_to_name || order.assigned_to_name || 'Unassigned',
              selectedInventoryItems: selectedInventoryItems || []
            }),
          }
        );

        if (response.ok) {
          console.log('Order update notification sent successfully');
        } else {
          console.error('Failed to send order update notification:', await response.text());
        }
      } catch (emailError) {
        console.error('Error sending order update notification:', emailError);
        // Don't block the update if email fails
      }
      
      setIsEditing(false);
      setValidationErrors({});
      onRefresh();
      window.dispatchEvent(new CustomEvent('orderStatusChanged'));
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Save Failed",
        description: "Failed to save changes. Please check your connection and try again.",
        variant: "destructive"
      });
      
      console.log('Save failed, keeping edit mode active to prevent data loss');
    } finally {
      setIsSaving(false);
    }
  }, [editedOrder, order, toast, onRefresh, selectedInventoryItems]);

  const handleCancel = useCallback(() => {
    console.log('Canceling edit mode');
    
    setIsEditing(false);
    setEditedOrder({
      company_name: "",
      company_address: "",
      contact_email: "",
      contact_phone: "",
      company_link: "",
      price: 0,
      currency: "EUR",
      priority: "medium",
      assigned_to: "",
      internal_notes: "",
      description: "",
      client_visible_update: ""
    });
    setValidationErrors({});
    
    // Reset inventory items to original state when canceling
    if (order?.inventory_items) {
      try {
        const originalItems = JSON.parse(order.inventory_items as string);
        onInventoryItemsChange(originalItems);
      } catch (error) {
        console.error('Error parsing original inventory items:', error);
        onInventoryItemsChange([]);
      }
    } else {
      onInventoryItemsChange([]);
    }
  }, [order, onInventoryItemsChange]);

  const hasErrors = Object.keys(validationErrors).filter(key => 
    key === 'company_name' // Only critical errors should block saving
  ).length > 0;

  return {
    isEditing,
    editedOrder,
    isSaving,
    validationErrors,
    hasErrors,
    handleEdit,
    handleFieldChange,
    handleSave,
    handleCancel
  };
};
