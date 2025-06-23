
export interface OrderFormData {
  company_name: string;
  company_address: string;
  contact_email: string;
  contact_phone: string;
  company_link: string;
  price: number;
  currency: string;
  priority: string;
}

export interface ValidationErrors {
  company_name?: string;
  contact_email?: string;
  price?: string;
}

export const validateOrderForm = (data: OrderFormData): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!data.company_name?.trim()) {
    errors.company_name = "Company name is required";
  }

  if (data.contact_email && data.contact_email.trim() && !isValidEmail(data.contact_email)) {
    errors.contact_email = "Please enter a valid email address";
  }

  if (data.price < 0) {
    errors.price = "Price cannot be negative";
  }

  return errors;
};

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
