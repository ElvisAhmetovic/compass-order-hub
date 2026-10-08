import { z } from "zod";

export type ContactFormMessages = {
  name: string;
  email: string;
  message: string;
};

export const createContactFormSchema = (messages: ContactFormMessages) => z.object({
  name: z.string().trim().min(1, messages.name).max(100, messages.name),
  email: z.string().trim().email(messages.email).max(255, messages.email),
  company: z.string().trim().max(150),
  service: z.string().trim().max(60),
  message: z.string().trim().min(10, messages.message).max(3000, messages.message),
});

export type ContactFormValues = z.infer<ReturnType<typeof createContactFormSchema>>;