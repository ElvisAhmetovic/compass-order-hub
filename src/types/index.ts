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
  category: string;
  description?: string;
  stock: number;
  unit: string;
  price: string;
  buyingPrice: string;
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
