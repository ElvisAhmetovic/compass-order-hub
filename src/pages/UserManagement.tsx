
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import Sidebar from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { UserManagementTable } from "@/components/user-management/UserManagementTable";
import { AddUserModal } from "@/components/user-management/AddUserModal";
import { User } from "@/types";
import { useToast } from "@/hooks/use-toast";

const UserManagement = () => {
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Load users from localStorage on component mount
  useEffect(() => {
    const loadUsers = () => {
      setIsLoading(true);
      try {
        // Get users from localStorage
        const storedUsers = localStorage.getItem("app_users");
        if (storedUsers) {
          setUsers(JSON.parse(storedUsers));
        } else {
          // Initialize with mock data if no users exist
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
          localStorage.setItem("app_users", JSON.stringify(mockUsers));
          setUsers(mockUsers);
        }
      } catch (error) {
        console.error("Error loading users:", error);
        toast({
          variant: "destructive",
          title: "Error loading users",
          description: "Could not load the user data."
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, [toast]);
  
  const handleAddUser = (newUser: User) => {
    try {
      const updatedUsers = [...users, newUser];
      localStorage.setItem("app_users", JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
      toast({
        title: "User added",
        description: "New user has been added successfully."
      });
    } catch (error) {
      console.error("Error adding user:", error);
      toast({
        variant: "destructive",
        title: "Error adding user",
        description: "Could not add the new user."
      });
    }
  };
  
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Layout userRole="admin">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                <p className="text-muted-foreground">
                  Manage users and their permissions
                </p>
              </div>
              <Button onClick={() => setIsAddUserModalOpen(true)}>
                Add User
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center p-8">
                <p>Loading users...</p>
              </div>
            ) : (
              <UserManagementTable users={users} setUsers={setUsers} />
            )}
            
            <AddUserModal 
              open={isAddUserModalOpen} 
              onClose={() => setIsAddUserModalOpen(false)}
              onAddUser={handleAddUser}
            />
          </div>
        </Layout>
      </div>
    </div>
  );
};

export default UserManagement;
