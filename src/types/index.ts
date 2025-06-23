export type UserRole = "admin" | "user" | "agent";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export type OrderPriority = "low" | "medium" | "high" | "urgent";

export type OrderStatus = 
  | "Created" 
  | "In Progress" 
  | "Invoice Sent" 
  | "Invoice Paid" 
  | "Complaint" 
  | "Resolved" 
  | "Cancelled" 
  | "Deleted"
  | "Review";

export interface Order {
  id: string;
  company_id?: string;
  company_name: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  company_address?: string;
  company_link?: string;
  price?: number;
  description?: string;
  status: OrderStatus; // Keep for backward compatibility
  priority?: OrderPriority;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string; // Add deleted_at property
  created_by?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  invoice_details?: InvoiceDetails;
  amount?: number;
  currency?: string;
  agent_name?: string;
  status_date?: string;
  inventory_items?: string | null;
  internal_notes?: string | null; // Add internal_notes property
  // New multi-status fields
  status_created?: boolean;
  status_in_progress?: boolean;
  status_complaint?: boolean;
  status_invoice_sent?: boolean;
  status_invoice_paid?: boolean;
  status_resolved?: boolean;
  status_cancelled?: boolean;
  status_deleted?: boolean;
  status_review?: boolean;
  // Yearly package field
  is_yearly_package?: boolean;
}

export interface InvoiceDetails {
  id: string;
  order_id: string;
  invoice_number: string;
  amount: number;
  issued_date: string;
  due_date: string;
  status: "paid" | "unpaid";
  transaction_id: string;
  transaction_date: string;
  account_number: string;
  reference_number: string;
  bank_details: string;
  posting_date: string;
  value_date: string;
  elba_reference: string;
}

export interface Company {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  contact_person: string;
  map_link?: string;
  mapLink?: string; // Keep for backward compatibility
  orders?: Order[]; // Keep for backward compatibility
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

export interface OrderComment {
  id: string;
  order_id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
  comment?: string;
  user: string | {
    full_name?: string;
    email?: string;
  };
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  userId: string;
  userName: string;
  createdAt: string;
  order_id: string;
  status: OrderStatus;
  changed_by: string;
  changed_at: string;
  notes: string;
}

export interface Proposal {
  id: string;
  reference: string;
  number: string;
  customer: string;
  subject: string;
  amount: string;
  status: string;
  created_at: string;
  updated_at: string;
  lineItems?: ProposalLineItem[];
  address?: string;
  country?: string;
  content?: string;
  totalAmount?: number;
  currency?: string;
  vatEnabled?: boolean; // Added VAT toggle property
}

export interface ProposalLineItem {
  id: string;
  proposal_id: string;
  item_id: string;
  name: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  category?: string;
  created_at: string;
  updated_at?: string;
  unit?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  description: string;
  lastBooking: string | null;
  stock: number;
  unit: string;
  price: string;
  buyingPrice: string;
  buyingPriceGross?: string;
  priceGross?: string;
  internalNote?: string;
}

export type SupportInquiryStatus = "new" | "open" | "in-progress" | "resolved" | "closed";

export interface SupportInquiry {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  subject: string;
  message: string;
  status: SupportInquiryStatus;
  created_at: string;
  updated_at?: string;
}

export interface SupportReply {
  id: string;
  inquiry_id: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  message: string;
  created_at: string;
}

export interface LoginResult {
  success: boolean;
  error?: string;
}

export interface SignUpResult {
  success: boolean;
  error?: string;
  needsEmailConfirmation?: boolean;
}
