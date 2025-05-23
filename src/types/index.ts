
export type UserRole = "admin" | "user";

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
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  company_address?: string;
  price: number;
  description: string;
  status: OrderStatus;
  priority: OrderPriority;
  created_at: string;
  updated_at: string;
  created_by?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  invoice_details?: InvoiceDetails;
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
  name: string;
  email: string;
  phone: string;
  address: string;
  mapLink: string;
  orders: Order[];
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
}
