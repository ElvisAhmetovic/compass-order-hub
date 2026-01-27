import { v4 as uuidv4 } from "uuid";
import { proposalTemplateService } from "@/services/proposalTemplateService";
import { proposalService } from "@/services/proposalService";

export interface ProposalTemplate {
  id: string;
  name: string;
  isDefault: boolean;
  templateData: Record<string, unknown>;
  createdAt: string;
}

// Async function to get default template from Supabase
export const getDefaultTemplateAsync = async (): Promise<Record<string, unknown> | null> => {
  try {
    const template = await proposalTemplateService.getDefaultTemplate();
    return template?.template_data || null;
  } catch (error) {
    console.error("Error loading default template:", error);
    return null;
  }
};

// Sync function for backward compatibility (checks localStorage as fallback)
export const getDefaultTemplate = (): Record<string, unknown> | null => {
  try {
    // First try localStorage for backward compatibility
    const savedTemplates = localStorage.getItem("proposalTemplates");
    if (savedTemplates) {
      const templates: ProposalTemplate[] = JSON.parse(savedTemplates);
      const defaultTemplate = templates.find(t => t.isDefault);
      if (defaultTemplate?.templateData) {
        return defaultTemplate.templateData;
      }
    }
    return null;
  } catch (error) {
    console.error("Error loading default template:", error);
    return null;
  }
};

export const createProposalFromTemplate = (templateData: Record<string, unknown>, newProposalId?: string): Record<string, unknown> => {
  const proposalId = newProposalId || uuidv4();
  const now = new Date().toISOString();
  
  // For new proposals, we'll generate number/reference from the service
  // This is a synchronous helper, so we use a placeholder
  const nextNumber = `AN-${Date.now().toString().slice(-4)}`;
  const reference = `REF-${new Date().getFullYear()}-${Date.now().toString().slice(-3)}`;
  
  return {
    ...templateData,
    id: proposalId,
    number: nextNumber,
    reference: reference,
    created_at: now,
    updated_at: now,
    status: "Draft",
    // Reset date/time to current
    proposalDate: new Date().toISOString().split('T')[0],
    proposalTime: new Date().toTimeString().slice(0, 5),
    // Regenerate line item IDs
    lineItems: Array.isArray(templateData.lineItems) 
      ? templateData.lineItems.map((item: Record<string, unknown>) => ({
          ...item,
          id: uuidv4(),
          proposal_id: proposalId,
          created_at: now
        }))
      : []
  };
};

// Async version that gets proper proposal numbers from the database
export const createProposalFromTemplateAsync = async (
  templateData: Record<string, unknown>, 
  newProposalId?: string
): Promise<Record<string, unknown>> => {
  const proposalId = newProposalId || uuidv4();
  const now = new Date().toISOString();
  
  // Get proper proposal number and reference from service
  const [nextNumber, reference] = await Promise.all([
    proposalService.getNextProposalNumber(),
    proposalService.getNextReference()
  ]);
  
  return {
    ...templateData,
    id: proposalId,
    number: nextNumber,
    reference: reference,
    created_at: now,
    updated_at: now,
    status: "Draft",
    // Reset date/time to current
    proposalDate: new Date().toISOString().split('T')[0],
    proposalTime: new Date().toTimeString().slice(0, 5),
    // Regenerate line item IDs
    lineItems: Array.isArray(templateData.lineItems) 
      ? templateData.lineItems.map((item: Record<string, unknown>) => ({
          ...item,
          id: uuidv4(),
          proposal_id: proposalId,
          created_at: now
        }))
      : []
  };
};

export const hasDefaultTemplate = (): boolean => {
  try {
    const savedTemplates = localStorage.getItem("proposalTemplates");
    if (savedTemplates) {
      const templates: ProposalTemplate[] = JSON.parse(savedTemplates);
      return templates.some(t => t.isDefault);
    }
    return false;
  } catch (error) {
    console.error("Error checking for default template:", error);
    return false;
  }
};

// Async version
export const hasDefaultTemplateAsync = async (): Promise<boolean> => {
  try {
    const template = await proposalTemplateService.getDefaultTemplate();
    return template !== null;
  } catch (error) {
    console.error("Error checking for default template:", error);
    return false;
  }
};
