
export type UserRole = 'admin' | 'agent' | 'user';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  full_name?: string;
  name?: string; // Adding for backward compatibility
}

export interface UserPermission {
  id: string;
  user_id: string;
  permission: string;
}

export interface Company {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  mapLink?: string;
  orders: Order[];
}

export type OrderStatus = 
  | 'Created' 
  | 'In Progress' 
  | 'Complaint' 
  | 'Invoice Sent' 
  | 'Invoice Paid' 
  | 'Resolved' 
  | 'Cancelled' 
  | 'Deleted'
  | 'Review';

export type OrderPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface Order {
  id: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  contact_address?: string; // Added address field
  description: string;
  price: number;
  status: OrderStatus;
  priority: OrderPriority;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  invoice_details?: InvoiceDetails;
  assigned_to_name?: string; // Adding this field to store the assignee's name
}

export interface InvoiceDetails {
  invoice_number: string;
  transaction_id: string;
  transaction_date: string;
  account_number: string;
  reference_number?: string;
  bank_details?: string;
  posting_date?: string;
  value_date?: string;
  elba_reference?: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  changed_by: string;
  changed_at: string;
  notes?: string;
}

export interface OrderComment {
  id: string;
  order_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  user?: {
    full_name?: string;
    email: string;
  };
}

// Extended Proposal type with additional fields for the proposal management interface
export interface Proposal {
  id: string;
  reference: string;
  number: string;
  customer: string;
  subject?: string;
  amount: string;
  status: string;
  created_at: string;
  updated_at?: string;
  lineItems?: ProposalLineItem[];
  currency?: string;
  deliveryTerms?: string;
  paymentTerms?: string;
  contactPerson?: string;
  vatRules?: string;
}

// New type for proposal line items
export interface ProposalLineItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  totalPrice: number;
  inventoryItemId?: string;
}

// Type for inventory items
export interface InventoryItem {
  id: string;
  name: string;
  category: "Article" | "Service";
  lastBooking: string | null;
  stock: string;
  price: string;
  buyingPrice?: string;
}
