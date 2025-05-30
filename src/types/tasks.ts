
export interface Task {
  id: string;
  title: string;
  description?: string;
  order_id: string;
  assigned_to: string;
  assigned_to_name: string;
  assigned_by: string;
  assigned_by_name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}
