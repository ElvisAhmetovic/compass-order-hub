
import { useState } from "react";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { User } from "@/types";
import { EditUserModal } from "./EditUserModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface UserManagementTableProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  onUsersChange: () => Promise<void>;
}

export const UserManagementTable = ({ users, setUsers, onUsersChange }: UserManagementTableProps) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast: uiToast } = useToast();

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("app_users")
        .delete()
        .eq("id", userId);
        
      if (error) {
        toast.error("Failed to delete user");
        console.error("Error deleting user:", error);
        return;
      }
      
      setUsers(users.filter(user => user.id !== userId));
      toast.success("User deleted successfully");
    } catch (err) {
      console.error("Unexpected error deleting user:", err);
      toast.error("An unexpected error occurred");
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      const { error } = await supabase
        .from("app_users")
        .update({
          email: updatedUser.email,
          full_name: updatedUser.full_name,
          role: updatedUser.role
        })
        .eq("id", updatedUser.id);
        
      if (error) {
        toast.error("Failed to update user");
        console.error("Error updating user:", error);
        return;
      }
      
      await onUsersChange();
      setIsEditModalOpen(false);
      toast.success("User updated successfully");
    } catch (err) {
      console.error("Unexpected error updating user:", err);
      toast.error("An unexpected error occurred");
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.full_name || "No Name"}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell className="capitalize">{user.role}</TableCell>
              <TableCell>{formatDate(user.created_at)}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEdit(user)}
                >
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      size="sm"
                    >
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the user
                        account and remove their data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(user.id)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {users.length === 0 && (
        <div className="p-4 text-center text-muted-foreground">
          No users found
        </div>
      )}
      
      <div className="p-4 text-sm text-muted-foreground border-t">
        Total {users.length} users
      </div>
      
      <div className="p-4 text-sm text-muted-foreground border-t">
        A list of your registered users.
      </div>
      
      {selectedUser && (
        <EditUserModal
          user={selectedUser}
          open={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={handleUpdateUser}
        />
      )}
    </div>
  );
};
