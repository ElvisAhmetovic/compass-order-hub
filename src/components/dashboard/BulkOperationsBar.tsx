
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2, Users, CheckCircle, X } from 'lucide-react';
import { Order, OrderStatus } from '@/types';
import { OrderService } from '@/services/orderService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

interface BulkOperationsBarProps {
  selectedOrders: Order[];
  onClearSelection: () => void;
  onRefresh: () => void;
  users?: Array<{ id: string; name: string }>;
}

const BulkOperationsBar = ({
  selectedOrders,
  onClearSelection,
  onRefresh,
  users = []
}: BulkOperationsBarProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  if (selectedOrders.length === 0) return null;

  const handleBulkStatusUpdate = async (status: OrderStatus, enabled: boolean = true) => {
    setIsUpdating(true);
    try {
      await Promise.all(
        selectedOrders.map(order => 
          OrderService.toggleOrderStatus(order.id, status, enabled)
        )
      );
      
      toast({
        title: "Status Updated",
        description: `Updated ${selectedOrders.length} orders to ${status}`,
      });
      
      onRefresh();
      onClearSelection();
    } catch (error) {
      console.error('Error updating orders:', error);
      toast({
        title: "Error",
        description: "Failed to update orders. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkAssignment = async (userId: string, userName: string) => {
    setIsUpdating(true);
    try {
      await Promise.all(
        selectedOrders.map(order => 
          OrderService.assignOrder(order.id, userId, userName)
        )
      );
      
      toast({
        title: "Orders Assigned",
        description: `Assigned ${selectedOrders.length} orders to ${userName}`,
      });
      
      onRefresh();
      onClearSelection();
    } catch (error) {
      console.error('Error assigning orders:', error);
      toast({
        title: "Error",
        description: "Failed to assign orders. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsUpdating(true);
    try {
      await Promise.all(
        selectedOrders.map(order => 
          OrderService.deleteOrder(order.id)
        )
      );
      
      toast({
        title: "Orders Deleted",
        description: `Deleted ${selectedOrders.length} orders`,
      });
      
      onRefresh();
      onClearSelection();
    } catch (error) {
      console.error('Error deleting orders:', error);
      toast({
        title: "Error",
        description: "Failed to delete orders. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {selectedOrders.length} selected
            </Badge>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClearSelection}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Status Updates */}
            <Select onValueChange={(value) => handleBulkStatusUpdate(value as OrderStatus)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Update Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="In Progress">Mark In Progress</SelectItem>
                <SelectItem value="Resolved">Mark Resolved</SelectItem>
                <SelectItem value="Cancelled">Mark Cancelled</SelectItem>
                <SelectItem value="Invoice Sent">Mark Invoice Sent</SelectItem>
                <SelectItem value="Invoice Paid">Mark Invoice Paid</SelectItem>
                <SelectItem value="Review">Mark for Review</SelectItem>
              </SelectContent>
            </Select>

            {/* Assignment */}
            {isAdmin && users.length > 0 && (
              <Select onValueChange={(value) => {
                const selectedUser = users.find(u => u.id === value);
                if (selectedUser) {
                  handleBulkAssignment(selectedUser.id, selectedUser.name);
                }
              }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Assign to..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {user.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Delete */}
            {isAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Orders</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {selectedOrders.length} orders? 
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleBulkDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Orders
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
        
        {isUpdating && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
            Updating...
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkOperationsBar;
