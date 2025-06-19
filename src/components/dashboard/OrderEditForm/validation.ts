
import { z } from "zod";

export const orderSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  company_address: z.string().optional(),
  contact_email: z.string().email("Invalid email format").optional().or(z.literal("")),
  contact_phone: z.string().optional(),
  company_link: z.string().url("Invalid URL format").optional().or(z.literal("")),
  price: z.number().min(0, "Price must be positive"),
  currency: z.string().min(1, "Currency is required"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
});

export type OrderFormData = z.infer<typeof orderSchema>;

export interface ValidationErrors {
  company_name?: string;
  company_address?: string;
  contact_email?: string;
  contact_phone?: string;
  company_link?: string;
  price?: string;
  currency?: string;
  priority?: string;
}

export const validateOrderForm = (data: Partial<OrderFormData>): ValidationErrors => {
  const errors: ValidationErrors = {};

  try {
    orderSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        const field = err.path[0] as keyof ValidationErrors;
        errors[field] = err.message;
      });
    }
  }

  return errors;
};
