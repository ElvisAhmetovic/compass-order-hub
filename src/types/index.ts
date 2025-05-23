
export interface User {
  id: string;
  full_name?: string;
  email: string;
  password?: string;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
  updated_at: string;
}

export interface SupportInquiry {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  status: "open" | "replied" | "closed";
  createdAt: string;
  replies: SupportReply[];
}

export interface SupportReply {
  id: string;
  inquiryId: string;
  userId: string;
  userName: string;
  userRole: string;
  message: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: "Article" | "Service";
  description?: string;
  stock: number;
  unit: string;
  price: string;
  buyingPrice: string;
  lastBooking?: string | null;
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

export interface ProposalLineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  price: number;
  vat: number;
  discount: number;
  amount: number;
}

// Missing types needed for other components
export type UserRole = "user" | "admin";

export interface Company {
  id: string;
  name: string;
  address?: string;
  industry?: string;
  contact?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export type OrderPriority = "low" | "medium" | "high";
export type OrderStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface Order {
  id: string;
  number: string;
  title: string;
  description?: string;
  customer: string;
  status: OrderStatus;
  priority: OrderPriority;
  assigned_to?: string;
  assigned_to_name?: string;
  created_at: string;
  due_date?: string;
  created_by: string;
  created_by_name: string;
  updated_at?: string;
}

export interface OrderComment {
  id: string;
  order_id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  status: OrderStatus;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface InvoiceDetails {
  id: string;
  order_id: string;
  invoice_number: string;
  amount: number;
  issued_date: string;
  due_date: string;
  status: "paid" | "unpaid" | "overdue";
}
