
export interface Client {
  id: string;
  name: string;
  contact_person?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  zip_code?: string;
  country?: string;
  vat_id?: string;
  tax_id?: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  issue_date: string;
  due_date: string;
  total_amount: number;
  net_amount: number;
  vat_amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled' | 'refunded';
  payment_terms?: string;
  notes?: string;
  internal_notes?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  proposal_id?: string;
  client?: Client;
}

export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  item_description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  vat_rate: number;
  discount_rate: number;
  line_total: number;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_date: string;
  payment_method: 'bank_transfer' | 'credit_card' | 'cash' | 'other';
  transaction_id?: string;
  notes?: string;
  created_at: string;
}

export interface InvoiceFormData {
  client_id: string;
  issue_date: string;
  due_date: string;
  currency: string;
  payment_terms: string;
  notes: string;
  internal_notes: string;
  line_items: Omit<InvoiceLineItem, 'id' | 'invoice_id' | 'created_at' | 'updated_at' | 'line_total'>[];
}
