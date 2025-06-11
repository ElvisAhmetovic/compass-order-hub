
// Re-export all functions and constants from the refactored modules
export { PROPOSAL_STATUSES } from "./proposal/constants";
export { SUPPORTED_LANGUAGES as PROPOSAL_LANGUAGES, translations } from "./proposalTranslations";
export { generateProposalPDF, previewProposalPDF } from "./proposal/pdfGenerator";
export { getCompanyInfo, saveCompanyInfo } from "./proposal/companyInfo";
export { 
  getProposalStatusColor, 
  loadInventoryItems, 
  formatInventoryItemForProposal, 
  downloadProposal 
} from "./proposal/helpers";
