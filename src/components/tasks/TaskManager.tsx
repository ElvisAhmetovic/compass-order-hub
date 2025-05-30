
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
import { CalendarIcon, Plus, Edit3 } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface TaskManagerProps {
  orderId: string;
}

const TaskManager = ({ orderId }: TaskManagerProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'medium' as const,
    due_date: undefined as Date | undefined
  });
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  // Fetch team members
  useEffect(() => {
    const fetchTeamMembers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role');
      
      if (data) {
        setTeamMembers(data.map(member => ({
          id: member.id,
          name: `${member.first_name} ${member.last_name}`.trim(),
          role: member.role
        })));
      }
    };
    fetchTeamMembers();
  }, []);

  // Fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        return;
      }

      setTasks(data || []);
    };

    fetchTasks();
  }, [orderId]);

  const createTask = async () => {
    if (!newTask.title.trim() || !newTask.assigned_to || !user) return;

    const assignedUser = teamMembers.find(u => u.id === newTask.assigned_to);
    if (!assignedUser) return;

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: newTask.title,
        description: newTask.description,
        order_id: orderId,
        assigned_to: newTask.assigned_to,
        assigned_to_name: assignedUser.name,
        assigned_by: user.id,
        assigned_by_name: user.full_name,
        status: 'pending',
        priority: newTask.priority,
        due_date: newTask.due_date?.toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive"
      });
      return;
    }

    setTasks(prev => [data, ...prev]);
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

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        ...updates,
        completed_at: updates.status === 'completed' ? new Date().toISOString() : null
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive"
      });
      return;
    }

    setTasks(prev => prev.map(task => 
      task.id === taskId ? data : task
    ));
    
    toast({
      title: "Task updated",
      description: `Task status changed to ${updates.status}`,
    });
  };

  const saveEditedTask = async () => {
    if (!editingTask) return;

    const assignedUser = teamMembers.find(u => u.id === editingTask.assigned_to);
    
    const { data, error } = await supabase
      .from('tasks')
      .update({
        title: editingTask.title,
        description: editingTask.description,
        assigned_to: editingTask.assigned_to,
        assigned_to_name: assignedUser?.name || editingTask.assigned_to_name,
        priority: editingTask.priority,
        due_date: editingTask.due_date,
        status: editingTask.status
      })
      .eq('id', editingTask.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive"
      });
      return;
    }

    setTasks(prev => prev.map(task => 
      task.id === editingTask.id ? data : task
    ));
    setEditingTask(null);
    
    toast({
      title: "Task updated",
      description: "Task has been updated successfully",
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
                    {teamMembers.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} ({member.role})
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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingTask(task)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
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
                        <Button size="sm" variant="outline" onClick={() => updateTask(task.id, { status: 'in_progress' })}>
                          Start
                        </Button>
                      )}
                      {task.status === 'in_progress' && (
                        <Button size="sm" variant="outline" onClick={() => updateTask(task.id, { status: 'completed' })}>
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

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <div className="space-y-4">
              <Input
                placeholder="Task title"
                value={editingTask.title}
                onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
              />
              <Textarea
                placeholder="Task description"
                value={editingTask.description || ''}
                onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
              />
              <Select value={editingTask.assigned_to} onValueChange={(value) => setEditingTask({ ...editingTask, assigned_to: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Assign to..." />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} ({member.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={editingTask.priority} onValueChange={(value: any) => setEditingTask({ ...editingTask, priority: value })}>
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
              <Select value={editingTask.status} onValueChange={(value: any) => setEditingTask({ ...editingTask, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={saveEditedTask} className="w-full">
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default TaskManager;
