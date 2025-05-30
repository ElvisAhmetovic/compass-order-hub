
export interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  content: string;
  created_at: string;
  channel_id?: string;
  order_id?: string;
  reply_to?: string;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  type: 'general' | 'order' | 'private';
  created_by: string;
  created_at: string;
  order_id?: string;
  participants?: string[];
}
