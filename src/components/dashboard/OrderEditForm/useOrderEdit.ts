
import { useState, useCallback } from "react";
import { Order, OrderPriority } from "@/types";
import { OrderService } from "@/services/orderService";
import { useToast } from "@/hooks/use-toast";
import { OrderFormData, ValidationErrors, validateOrderForm } from "./validation";

export const useOrderEdit = (order: Order | null, onRefresh: () => void) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedOrder, setEditedOrder] = useState<OrderFormData>({
    company_name: "",
    company_address: "",
    contact_email: "",
    contact_phone: "",
    company_link: "",
    description: "",
    price: 0,
    currency: "EUR",
    priority: "medium"
  });
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const { toast } = useToast();

  const handleEdit = useCallback(() => {
    if (!order) return;
    
    // Safeguard: Create a backup of original data to prevent data loss
    const safeOrderData = {
      company_name: order.company_name || "",
      company_address: order.company_address || "",
      contact_email: order.contact_email || "",
      contact_phone: order.contact_phone || "",
      company_link: order.company_link || "",
      description: order.description || "",
      price: order.price || 0,
      currency: order.currency || "EUR",
      priority: (order.priority || "medium") as OrderPriority
    };
    
    console.log('Starting edit mode with safe data:', safeOrderData);
    
    setIsEditing(true);
    setEditedOrder(safeOrderData);
    setValidationErrors({});
  }, [order]);

  const handleFieldChange = useCallback((field: keyof OrderFormData, value: string | number) => {
    console.log(`Updating field ${field} with value:`, value);
    
    // Safeguard: Ensure we never set undefined or null values
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
    if (!order) return;
    
    console.log('Attempting to save order with data:', editedOrder);
    
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
      // Safeguard: Ensure all values are properly defined before sending to API
      const updateData: Partial<Order> = {
        company_name: editedOrder.company_name || order.company_name || "",
        company_address: editedOrder.company_address || "",
        contact_email: editedOrder.contact_email || "",
        contact_phone: editedOrder.contact_phone || "",
        company_link: editedOrder.company_link || "",
        description: editedOrder.description || "",
        price: editedOrder.price !== undefined ? editedOrder.price : 0,
        currency: editedOrder.currency || "EUR",
        priority: editedOrder.priority || "medium"
      };
      
      console.log('Sending update data to API:', updateData);
      
      await OrderService.updateOrder(order.id, updateData);
      
      toast({
        title: "Order Updated",
        description: "Order details have been successfully updated.",
      });
      
      console.log('Order updated successfully');
      
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
      
      // Safeguard: Don't exit edit mode on save failure to prevent data loss
      console.log('Save failed, keeping edit mode active to prevent data loss');
    } finally {
      setIsSaving(false);
    }
  }, [editedOrder, order, toast, onRefresh]);

  const handleCancel = useCallback(() => {
    console.log('Canceling edit mode');
    
    setIsEditing(false);
    setEditedOrder({
      company_name: "",
      company_address: "",
      contact_email: "",
      contact_phone: "",
      company_link: "",
      description: "",
      price: 0,
      currency: "EUR",
      priority: "medium"
    });
    setValidationErrors({});
  }, []);

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
