
import { validateEmail } from "@/utils/formValidation";
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
}

export interface ValidationErrors {
  company_name?: string;
  contact_email?: string;
  contact_phone?: string;
  company_link?: string;
  price?: string;
}

export const validateOrderForm = (data: OrderFormData): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Company name validation - only require if it's completely empty
  if (!data.company_name || !data.company_name.trim()) {
    errors.company_name = "Company name is required";
  }

  // Email validation - only validate if email is provided
  if (data.contact_email && data.contact_email.trim()) {
    const emailError = validateEmail(data.contact_email);
    if (emailError) {
      errors.contact_email = emailError;
    }
  }

  // Phone validation - only validate if phone is provided and be more lenient
  if (data.contact_phone && data.contact_phone.trim()) {
    const phoneRegex = /^[\+]?[\d\s\-\(\)\.]{5,}$/; // More lenient regex
    if (!phoneRegex.test(data.contact_phone.trim())) {
      errors.contact_phone = "Please enter a valid phone number";
    }
  }

  // Website validation - only validate if URL is provided and be more lenient
  if (data.company_link && data.company_link.trim()) {
    const link = data.company_link.trim();
    // Allow URLs with or without protocol
    if (!link.includes('.') || link.length < 4) {
      errors.company_link = "Please enter a valid website URL";
    }
  }

  // Price validation - be more lenient
  if (data.price !== undefined && data.price < 0) {
    errors.price = "Price cannot be negative";
  }

  return errors;
};
