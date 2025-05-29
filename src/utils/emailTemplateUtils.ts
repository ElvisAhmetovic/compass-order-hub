
import { EmailTemplate, EmailTemplateVariables } from "@/types/emailTemplate";

export const DEFAULT_EMAIL_TEMPLATE: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
  name: "Default Payment Reminder",
  subject: "Payment Reminder - Invoice {invoiceNumber} is {daysOverdue} days overdue",
  body: `Dear {clientName},

We hope this message finds you well. We wanted to bring to your attention that your invoice {invoiceNumber} is currently {daysOverdue} days overdue.

Invoice Details:
• Invoice Number: {invoiceNumber}
• Amount Due: {amount}
• Original Due Date: {dueDate}
• Days Overdue: {daysOverdue}

We kindly request that you process this payment at your earliest convenience. If you have already sent the payment, please disregard this reminder.

Payment Instructions:
{paymentInstructions}

If you have any questions or concerns regarding this invoice, please don't hesitate to contact us. We value our business relationship and appreciate your prompt attention to this matter.

Best regards,
{companyName}`,
  isDefault: true
};

export const replaceTemplateVariables = (template: string, variables: EmailTemplateVariables): string => {
  return template
    .replace(/\{clientName\}/g, variables.clientName)
    .replace(/\{invoiceNumber\}/g, variables.invoiceNumber)
    .replace(/\{amount\}/g, variables.amount)
    .replace(/\{dueDate\}/g, variables.dueDate)
    .replace(/\{daysOverdue\}/g, variables.daysOverdue.toString())
    .replace(/\{companyName\}/g, variables.companyName)
    .replace(/\{paymentInstructions\}/g, variables.paymentInstructions);
};

export const getEmailTemplates = (): EmailTemplate[] => {
  try {
    const saved = localStorage.getItem("emailTemplates");
    if (saved) {
      return JSON.parse(saved);
    }
    return [];
  } catch (error) {
    console.error("Error loading email templates:", error);
    return [];
  }
};

export const saveEmailTemplate = (template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): EmailTemplate => {
  const templates = getEmailTemplates();
  const now = new Date().toISOString();
  
  const newTemplate: EmailTemplate = {
    ...template,
    id: `template_${Date.now()}`,
    createdAt: now,
    updatedAt: now
  };

  // If this is being set as default, remove default from others
  if (template.isDefault) {
    templates.forEach(t => t.isDefault = false);
  }

  const updatedTemplates = [...templates, newTemplate];
  localStorage.setItem("emailTemplates", JSON.stringify(updatedTemplates));
  return newTemplate;
};

export const updateEmailTemplate = (id: string, updates: Partial<EmailTemplate>): EmailTemplate | null => {
  const templates = getEmailTemplates();
  const index = templates.findIndex(t => t.id === id);
  
  if (index === -1) return null;

  const updatedTemplate = {
    ...templates[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  // If this is being set as default, remove default from others
  if (updates.isDefault) {
    templates.forEach(t => t.isDefault = false);
  }

  templates[index] = updatedTemplate;
  localStorage.setItem("emailTemplates", JSON.stringify(templates));
  return updatedTemplate;
};

export const deleteEmailTemplate = (id: string): boolean => {
  const templates = getEmailTemplates();
  const filteredTemplates = templates.filter(t => t.id !== id);
  
  if (filteredTemplates.length === templates.length) return false;
  
  localStorage.setItem("emailTemplates", JSON.stringify(filteredTemplates));
  return true;
};

export const getDefaultTemplate = (): EmailTemplate => {
  const templates = getEmailTemplates();
  const defaultTemplate = templates.find(t => t.isDefault);
  
  if (defaultTemplate) return defaultTemplate;
  
  // Create and save default template if none exists
  return saveEmailTemplate(DEFAULT_EMAIL_TEMPLATE);
};
