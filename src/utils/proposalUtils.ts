
// Re-export all functions and constants from the refactored modules
export { PROPOSAL_LANGUAGES, translations, PROPOSAL_STATUSES } from "./proposal/constants";
export { generateProposalPDF, previewProposalPDF } from "./proposal/pdfGenerator";
export { getCompanyInfo, saveCompanyInfo } from "./proposal/companyInfo";
export { 
  getProposalStatusColor, 
  loadInventoryItems, 
  formatInventoryItemForProposal, 
  downloadProposal 
} from "./proposal/helpers";
