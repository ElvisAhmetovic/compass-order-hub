
import { OrderPriority } from "@/types";

export interface OrderFormData {
  company_name: string;
  company_address: string;
  contact_email: string;
  contact_phone: string;
  company_link: string;
  description: string;
  price: number;
  currency: string;
  priority: OrderPriority;
  assigned_to?: string;
}

export interface ValidationErrors {
  company_name?: string;
  company_address?: string;
  contact_email?: string;
  contact_phone?: string;
  company_link?: string;
  description?: string;
  price?: string;
  currency?: string;
  priority?: string;
  assigned_to?: string;
}

export const validateOrderForm = (data: OrderFormData): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Company name is required
  if (!data.company_name?.trim()) {
    errors.company_name = "Company name is required";
  }

  // Email validation (if provided)
  if (data.contact_email?.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.contact_email)) {
      errors.contact_email = "Please enter a valid email address";
    }
  }

  // Price validation
  if (data.price !== undefined && data.price < 0) {
    errors.price = "Price cannot be negative";
  }

  // Currency validation
  const validCurrencies = ['EUR', 'USD', 'CHF', 'GBP'];
  if (data.currency && !validCurrencies.includes(data.currency)) {
    errors.currency = "Please select a valid currency";
  }

  // Priority validation
  const validPriorities: OrderPriority[] = ['low', 'medium', 'high', 'urgent'];
  if (data.priority && !validPriorities.includes(data.priority)) {
    errors.priority = "Please select a valid priority";
  }

  return errors;
};
