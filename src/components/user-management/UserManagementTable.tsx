
import { useState, useEffect } from "react";
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

// Mock data for users
const mockUsers: User[] = [
  {
    id: "1",
    email: "kleinabmedia1@gmail.com",
    role: "user",
    created_at: new Date().toISOString(),
    full_name: "No Name"
  },
  {
    id: "2",
    email: "office@websworkers.com",
    role: "user",
    created_at: new Date().toISOString(),
    full_name: "No Name"
  },
  {
    id: "3",
    email: "atwi.automobile.hannover@gmail.com",
    role: "user",
    created_at: new Date().toISOString(),
    full_name: "ATWI"
  },
  {
    id: "4",
    email: "cmen.sedat242@gmail.com",
    role: "user",
    created_at: new Date().toISOString(),
    full_name: "No Name"
  },
  {
    id: "5",
    email: "joka4927@gmail.com",
    role: "admin",
    created_at: new Date().toISOString(),
    full_name: "No Name"
  },
  {
    id: "6",
    email: "kontakt@abmedia24.com",
    role: "user",
    created_at: new Date().toISOString(),
    full_name: "No Name"
  }
];

export const UserManagementTable = () => {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleDelete = (userId: string) => {
    setUsers(users.filter(user => user.id !== userId));
    toast({
      title: "User deleted",
      description: "The user has been successfully removed.",
    });
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(users.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    ));
    setIsEditModalOpen(false);
    toast({
      title: "User updated",
      description: "The user information has been updated successfully.",
    });
  };

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.full_name || "No Name"}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
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
