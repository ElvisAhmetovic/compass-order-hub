
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarEvent } from '@/types/calendar';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { CalendarIcon, Plus } from 'lucide-react';
import { format, isSameDay } from 'date-fns';

interface CalendarViewProps {
  orderId?: string;
}

const CalendarView = ({ orderId }: CalendarViewProps) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    type: 'appointment' as const,
    start_date: new Date(),
    end_date: new Date(),
    location: ''
  });
  const { user } = useAuth();

  // Mock data for demonstration
  useEffect(() => {
    const mockEvents: CalendarEvent[] = [
      {
        id: '1',
        title: 'Client Meeting',
        description: 'Initial consultation with the client',
        start_date: new Date(Date.now() + 86400000).toISOString(),
        end_date: new Date(Date.now() + 86400000 + 3600000).toISOString(),
        type: 'appointment',
        order_id: orderId,
        created_by: 'user1',
        created_by_name: 'John Doe',
        location: 'Conference Room A',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Project Deadline',
        description: 'Final submission deadline for the project',
        start_date: new Date(Date.now() + 604800000).toISOString(),
        end_date: new Date(Date.now() + 604800000).toISOString(),
        type: 'deadline',
        order_id: orderId,
        created_by: 'user1',
        created_by_name: 'John Doe',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    setEvents(mockEvents);
  }, [orderId]);

  const createEvent = () => {
    if (!newEvent.title.trim() || !user) return;

    const event: CalendarEvent = {
      id: Date.now().toString(),
      title: newEvent.title,
      description: newEvent.description,
      start_date: newEvent.start_date.toISOString(),
      end_date: newEvent.end_date.toISOString(),
      type: newEvent.type,
      order_id: orderId,
      created_by: user.id,
      created_by_name: user.full_name,
      location: newEvent.location,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setEvents(prev => [...prev, event]);
    setNewEvent({
      title: '',
      description: '',
      type: 'appointment',
      start_date: new Date(),
      end_date: new Date(),
      location: ''
    });
    setIsCreateDialogOpen(false);
    
    toast({
      title: "Event created",
      description: `${newEvent.type} "${newEvent.title}" has been scheduled`,
    });
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(new Date(event.start_date), date));
  };

  const getEventTypeColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'appointment': return 'bg-blue-100 text-blue-800';
      case 'deadline': return 'bg-red-100 text-red-800';
      case 'meeting': return 'bg-green-100 text-green-800';
      case 'reminder': return 'bg-yellow-100 text-yellow-800';
    }
  };

  const selectedDateEvents = getEventsForDate(selectedDate);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Calendar</CardTitle>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Event
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Event</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Event title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  />
                  <Textarea
                    placeholder="Event description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  />
                  <Select value={newEvent.type} onValueChange={(value: any) => setNewEvent({ ...newEvent, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="appointment">Appointment</SelectItem>
                      <SelectItem value="deadline">Deadline</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Location (optional)"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="datetime-local"
                      value={format(newEvent.start_date, "yyyy-MM-dd'T'HH:mm")}
                      onChange={(e) => setNewEvent({ ...newEvent, start_date: new Date(e.target.value) })}
                    />
                    <Input
                      type="datetime-local"
                      value={format(newEvent.end_date, "yyyy-MM-dd'T'HH:mm")}
                      onChange={(e) => setNewEvent({ ...newEvent, end_date: new Date(e.target.value) })}
                    />
                  </div>
                  <Button onClick={createEvent} className="w-full">
                    Create Event
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Events for {format(selectedDate, "PPPP")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {selectedDateEvents.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No events scheduled for this date</p>
            ) : (
              selectedDateEvents.map((event) => (
                <div key={event.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{event.title}</h4>
                    <Badge className={getEventTypeColor(event.type)}>
                      {event.type}
                    </Badge>
                  </div>
                  {event.description && (
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  )}
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>
                      Time: {format(new Date(event.start_date), "HH:mm")} - {format(new Date(event.end_date), "HH:mm")}
                    </div>
                    {event.location && (
                      <div>Location: {event.location}</div>
                    )}
                    <div>Created by: {event.created_by_name}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarView;
