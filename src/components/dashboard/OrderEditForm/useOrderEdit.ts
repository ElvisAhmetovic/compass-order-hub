
import { useState, useCallback } from "react";
import { Order, OrderPriority } from "@/types";
import { OrderService } from "@/services/orderService";
import { useToast } from "@/hooks/use-toast";
import { OrderFormData, ValidationErrors, validateOrderForm } from "./validation";

export const useOrderEdit = (order: Order, onRefresh: () => void) => {
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
    setValidationErrors({});
  }, [order]);

  const handleFieldChange = useCallback((field: keyof OrderFormData, value: string | number) => {
    setEditedOrder(prev => ({ ...prev, [field]: value }));
    
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
    const errors = validateOrderForm(editedOrder);
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast({
        title: "Validation Error",
        description: "Please fix the errors below before saving.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      // Cast to Partial<Order> to ensure type compatibility
      const updateData: Partial<Order> = {
        company_name: editedOrder.company_name,
        company_address: editedOrder.company_address,
        contact_email: editedOrder.contact_email,
        contact_phone: editedOrder.contact_phone,
        company_link: editedOrder.company_link,
        description: editedOrder.description,
        price: editedOrder.price,
        currency: editedOrder.currency,
        priority: editedOrder.priority
      };
      
      await OrderService.updateOrder(order.id, updateData);
      
      toast({
        title: "Order Updated",
        description: "Order details have been successfully updated.",
      });
      
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
    } finally {
      setIsSaving(false);
    }
  }, [editedOrder, order.id, toast, onRefresh]);

  const handleCancel = useCallback(() => {
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

  const hasErrors = Object.keys(validationErrors).length > 0;

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
