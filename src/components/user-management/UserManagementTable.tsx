
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EditUserModal } from "./EditUserModal";
import { User } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { AssignOrdersModal } from "./AssignOrdersModal";
import { supabase } from "@/integrations/supabase/client";

interface UserManagementTableProps {
  users: User[];
  setUsers: (users: User[]) => void;
  onReload: () => Promise<void>;
}

export function UserManagementTable({ users, setUsers, onReload }: UserManagementTableProps) {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  
  // Check if current user is the main admin who can change roles
  const isMainAdmin = currentUser?.email === "luciferbebistar@gmail.com";
  
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };
  
  const handleAssignOrders = (user: User) => {
    setSelectedUser(user);
    setIsAssignModalOpen(true);
  };
  
  const handleDeleteUser = async (userId: string) => {
    // Prevent deletion of the main admin account
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete?.email === "luciferbebistar@gmail.com") {
      toast({
        variant: "destructive",
        title: "Cannot delete main admin",
        description: "The main administrator account cannot be deleted."
      });
      return;
    }
    
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        console.log('Deleting user:', userId);
        
        // Delete user from Supabase profiles
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', userId);

        if (error) {
          console.error('Delete error:', error);
          throw error;
        }

        // Reload users to reflect changes
        await onReload();
        
        toast({
          title: "User deleted",
          description: "User has been successfully deleted."
        });
      } catch (error: any) {
        console.error("Error deleting user:", error);
        toast({
          variant: "destructive",
          title: "Error deleting user",
          description: error.message || "Could not delete the user from database."
        });
      }
    }
  };
  
  const handleUpdateUser = async (updatedUser: User) => {
    try {
      console.log('Updating user:', updatedUser);
      
      const nameParts = updatedUser.full_name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Update the profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          role: updatedUser.role,
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedUser.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw profileError;
      }

      // Update the user's auth metadata to ensure role is reflected in session
      try {
        const { error: authError } = await supabase.auth.admin.updateUserById(updatedUser.id, {
          user_metadata: {
            full_name: updatedUser.full_name,
            first_name: firstName,
            last_name: lastName,
            role: updatedUser.role
          }
        });

        if (authError) {
          console.log('Auth metadata update failed, but profile was updated:', authError);
          // Don't throw here as the profile update succeeded
        } else {
          console.log('Successfully updated auth metadata');
        }
      } catch (authError) {
        console.log('Could not update auth metadata:', authError);
        // Don't throw here as the profile update succeeded
      }

      // If the current user's role was updated, refresh their session
      if (currentUser?.id === updatedUser.id) {
        console.log('Current user role updated, refreshing session...');
        // Wait a moment for the database to update
        setTimeout(async () => {
          await currentUser?.refreshUser?.();
          window.location.reload(); // Force a page reload to ensure all components refresh
        }, 1000);
      }

      // Reload users to reflect changes
      await onReload();
      setIsEditModalOpen(false);
      setEditingUser(null);
      
      toast({
        title: "User updated",
        description: "User has been successfully updated."
      });
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast({
        variant: "destructive",
        title: "Error updating user",
        description: error.message || "Could not update the user in database."
      });
    }
  };
  
  if (users.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No users to display.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.full_name}</TableCell>
                <TableCell className="capitalize">
                  {user.role}
                  {user.email === "luciferbebistar@gmail.com" && (
                    <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      Main Admin
                    </span>
                  )}
                </TableCell>
                <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleEditUser(user)}>
                        Edit User
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAssignOrders(user)}>
                        Assign Orders
                      </DropdownMenuItem>
                      {user.email !== "luciferbebistar@gmail.com" && (
                        <DropdownMenuItem 
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-destructive"
                        >
                          Delete User
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {editingUser && (
        <EditUserModal 
          user={editingUser}
          open={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={handleUpdateUser}
          canEditRole={isMainAdmin}
        />
      )}
      
      {selectedUser && (
        <AssignOrdersModal
          user={selectedUser}
          open={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
        />
      )}
    </div>
  );
}
