
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  type: 'appointment' | 'deadline' | 'meeting' | 'reminder';
  order_id?: string;
  created_by: string;
  created_by_name: string;
  attendees?: string[];
  location?: string;
  created_at: string;
  updated_at: string;
}
