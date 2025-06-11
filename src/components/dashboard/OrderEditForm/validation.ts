
import { validateEmail } from "@/utils/formValidation";

export interface OrderFormData {
  company_name: string;
  company_address: string;
  contact_email: string;
  contact_phone: string;
  company_link: string;
  description: string;
  price: number;
  currency: string;
  priority: string;
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

  // Company name validation
  if (!data.company_name?.trim()) {
    errors.company_name = "Company name is required";
  } else if (data.company_name.trim().length < 2) {
    errors.company_name = "Company name must be at least 2 characters";
  }

  // Email validation
  if (data.contact_email?.trim()) {
    const emailError = validateEmail(data.contact_email);
    if (emailError) {
      errors.contact_email = emailError;
    }
  }

  // Phone validation
  if (data.contact_phone?.trim()) {
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{7,}$/;
    if (!phoneRegex.test(data.contact_phone.trim())) {
      errors.contact_phone = "Please enter a valid phone number";
    }
  }

  // Website validation
  if (data.company_link?.trim()) {
    try {
      new URL(data.company_link);
    } catch {
      errors.company_link = "Please enter a valid URL (e.g., https://example.com)";
    }
  }

  // Price validation
  if (data.price !== undefined && data.price < 0) {
    errors.price = "Price cannot be negative";
  }

  return errors;
};
