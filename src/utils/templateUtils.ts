
import { v4 as uuidv4 } from "uuid";

export interface ProposalTemplate {
  id: string;
  name: string;
  isDefault: boolean;
  templateData: any;
  createdAt: string;
}

export const getDefaultTemplate = (): any | null => {
  try {
    const savedTemplates = localStorage.getItem("proposalTemplates");
    if (savedTemplates) {
      const templates: ProposalTemplate[] = JSON.parse(savedTemplates);
      const defaultTemplate = templates.find(t => t.isDefault);
      return defaultTemplate?.templateData || null;
    }
    return null;
  } catch (error) {
    console.error("Error loading default template:", error);
    return null;
  }
};

export const createProposalFromTemplate = (templateData: any, newProposalId?: string): any => {
  const proposalId = newProposalId || uuidv4();
  const now = new Date().toISOString();
  
  // Generate new proposal number
  const savedProposals = localStorage.getItem("proposals");
  const proposals = savedProposals ? JSON.parse(savedProposals) : [];
  const nextNumber = `AN-${(9984 + proposals.length + 1).toString()}`;
  
  return {
    ...templateData,
    id: proposalId,
    number: nextNumber,
    reference: `REF-${new Date().getFullYear()}-${(proposals.length + 1).toString().padStart(3, '0')}`,
    created_at: now,
    updated_at: now,
    status: "Draft",
    // Reset date/time to current
    proposalDate: new Date().toISOString().split('T')[0],
    proposalTime: new Date().toTimeString().slice(0, 5),
    // Regenerate line item IDs
    lineItems: templateData.lineItems?.map((item: any) => ({
      ...item,
      id: uuidv4(),
      proposal_id: proposalId,
      created_at: now
    })) || []
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
