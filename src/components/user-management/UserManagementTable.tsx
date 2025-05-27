
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

interface UserManagementTableProps {
  users: User[];
  setUsers: (users: User[]) => void;
}

export function UserManagementTable({ users, setUsers }: UserManagementTableProps) {
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
  
  const handleDeleteUser = (userId: string) => {
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
        // Delete user from localStorage
        const updatedUsers = users.filter(user => user.id !== userId);
        localStorage.setItem("app_users", JSON.stringify(updatedUsers));
        setUsers(updatedUsers);
        
        // Also delete from auth storage
        const authUsers = JSON.parse(localStorage.getItem("users") || "[]");
        const updatedAuthUsers = authUsers.filter((user: any) => user.id !== userId);
        localStorage.setItem("users", JSON.stringify(updatedAuthUsers));
        
        toast({
          title: "User deleted",
          description: "User has been successfully deleted."
        });
      } catch (error) {
        console.error("Error deleting user:", error);
        toast({
          variant: "destructive",
          title: "Error deleting user",
          description: "Could not delete the user."
        });
      }
    }
  };
  
  const handleUpdateUser = (updatedUser: User) => {
    try {
      const updatedUsers = users.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      );
      localStorage.setItem("app_users", JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
      setIsEditModalOpen(false);
      setEditingUser(null);
      
      toast({
        title: "User updated",
        description: "User has been successfully updated."
      });
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        variant: "destructive",
        title: "Error updating user",
        description: "Could not update the user."
      });
    }
  };
  
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
