
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InternalChat from '@/components/messaging/InternalChat';
import TaskManager from '@/components/tasks/TaskManager';
import CalendarView from '@/components/calendar/CalendarView';

interface OrderCollaborationProps {
  orderId: string;
}

const OrderCollaboration = ({ orderId }: OrderCollaborationProps) => {
  return (
    <Tabs defaultValue="tasks" className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="tasks">Tasks</TabsTrigger>
        <TabsTrigger value="chat">Discussion</TabsTrigger>
        <TabsTrigger value="calendar">Schedule</TabsTrigger>
      </TabsList>

      <TabsContent value="tasks">
        <TaskManager orderId={orderId} />
      </TabsContent>

      <TabsContent value="chat">
        <InternalChat orderId={orderId} channelId={`order-${orderId}`} />
      </TabsContent>

      <TabsContent value="calendar">
        <CalendarView orderId={orderId} />
      </TabsContent>
    </Tabs>
  );
};

export default OrderCollaboration;
