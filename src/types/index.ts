export type UserRole = 'admin' | 'agent' | 'user';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  full_name?: string;
}

export interface UserPermission {
  id: string;
  user_id: string;
  permission: string;
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
  description: string;
  price: number;
  status: OrderStatus;
  priority: OrderPriority;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
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
