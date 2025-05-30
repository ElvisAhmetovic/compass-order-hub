
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Task } from '@/types/tasks';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';

interface TaskManagerProps {
  orderId: string;
}

const TaskManager = ({ orderId }: TaskManagerProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'medium' as const,
    due_date: undefined as Date | undefined
  });
  const { user } = useAuth();

  // Mock users for assignment
  const mockUsers = [
    { id: 'user1', name: 'John Doe', role: 'admin' },
    { id: 'user2', name: 'Jane Smith', role: 'agent' },
    { id: 'user3', name: 'Bob Johnson', role: 'user' }
  ];

  // Mock data for demonstration
  useEffect(() => {
    const mockTasks: Task[] = [
      {
        id: '1',
        title: 'Review customer requirements',
        description: 'Go through the detailed requirements provided by the customer',
        order_id: orderId,
        assigned_to: 'user2',
        assigned_to_name: 'Jane Smith',
        assigned_by: 'user1',
        assigned_by_name: 'John Doe',
        status: 'in_progress',
        priority: 'high',
        due_date: new Date(Date.now() + 86400000).toISOString(),
        created_at: new Date(Date.now() - 3600000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: '2',
        title: 'Prepare initial proposal',
        description: 'Create the first draft of the proposal based on requirements',
        order_id: orderId,
        assigned_to: 'user3',
        assigned_to_name: 'Bob Johnson',
        assigned_by: 'user1',
        assigned_by_name: 'John Doe',
        status: 'pending',
        priority: 'medium',
        due_date: new Date(Date.now() + 172800000).toISOString(),
        created_at: new Date(Date.now() - 1800000).toISOString(),
        updated_at: new Date(Date.now() - 1800000).toISOString()
      }
    ];

    setTasks(mockTasks);
  }, [orderId]);

  const createTask = () => {
    if (!newTask.title.trim() || !newTask.assigned_to || !user) return;

    const assignedUser = mockUsers.find(u => u.id === newTask.assigned_to);
    if (!assignedUser) return;

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description,
      order_id: orderId,
      assigned_to: newTask.assigned_to,
      assigned_to_name: assignedUser.name,
      assigned_by: user.id,
      assigned_by_name: user.full_name,
      status: 'pending',
      priority: newTask.priority,
      due_date: newTask.due_date?.toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setTasks(prev => [...prev, task]);
    setNewTask({
      title: '',
      description: '',
      assigned_to: '',
      priority: 'medium',
      due_date: undefined
    });
    setIsCreateDialogOpen(false);
    
    toast({
      title: "Task created",
      description: `Task assigned to ${assignedUser.name}`,
    });
  };

  const updateTaskStatus = (taskId: string, status: Task['status']) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status, updated_at: new Date().toISOString() }
        : task
    ));
    
    toast({
      title: "Task updated",
      description: `Task status changed to ${status}`,
    });
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'high': return 'bg-red-100 text-red-800';
      case 'urgent': return 'bg-red-200 text-red-900';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Task Management</CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Task title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
                <Textarea
                  placeholder="Task description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
                <Select value={newTask.assigned_to} onValueChange={(value) => setNewTask({ ...newTask, assigned_to: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Assign to..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mockUsers.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={newTask.priority} onValueChange={(value: any) => setNewTask({ ...newTask, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newTask.due_date ? format(newTask.due_date, "PPP") : "Pick a due date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newTask.due_date}
                      onSelect={(date) => setNewTask({ ...newTask, due_date: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Button onClick={createTask} className="w-full">
                  Create Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No tasks assigned yet</p>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{task.title}</h4>
                  <div className="flex gap-2">
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                {task.description && (
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                )}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Assigned to: {task.assigned_to_name}</span>
                  {task.due_date && (
                    <span>Due: {format(new Date(task.due_date), "PPP")}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  {task.status !== 'completed' && (
                    <>
                      {task.status === 'pending' && (
                        <Button size="sm" variant="outline" onClick={() => updateTaskStatus(task.id, 'in_progress')}>
                          Start
                        </Button>
                      )}
                      {task.status === 'in_progress' && (
                        <Button size="sm" variant="outline" onClick={() => updateTaskStatus(task.id, 'completed')}>
                          Complete
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskManager;
