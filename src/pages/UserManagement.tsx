
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import Sidebar from "@/components/dashboard/Sidebar";
import AdminGuard from "@/components/auth/AdminGuard";
import { Button } from "@/components/ui/button";
import { UserManagementTable } from "@/components/user-management/UserManagementTable";
import { AddUserModal } from "@/components/user-management/AddUserModal";
import { User } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const UserManagement = () => {
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  
  // Load users from Supabase profiles table
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Convert profiles to User format
      const formattedUsers: User[] = profiles.map(profile => ({
        id: profile.id,
        email: profile.email || '',
        role: profile.role,
        full_name: `${profile.first_name} ${profile.last_name}`.trim() || 'No Name',
        created_at: profile.created_at || new Date().toISOString(),
        updated_at: profile.updated_at || new Date().toISOString()
      }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error("Error loading users:", error);
      toast({
        variant: "destructive",
        title: "Error loading users",
        description: "Could not load the user data from database."
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [toast]);
  
  const handleAddUser = async (newUser: User) => {
    try {
      // Since we can't directly create auth users, we'll just add to profiles
      // In a real implementation, you'd use Supabase Admin API or invite system
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: newUser.id,
          first_name: newUser.full_name.split(' ')[0] || '',
          last_name: newUser.full_name.split(' ').slice(1).join(' ') || '',
          role: newUser.role
        });

      if (error) {
        throw error;
      }

      // Reload users to show the new one
      await loadUsers();
      
      toast({
        title: "User added",
        description: "New user has been added successfully."
      });
    } catch (error) {
      console.error("Error adding user:", error);
      toast({
        variant: "destructive",
        title: "Error adding user",
        description: "Could not add the new user to database."
      });
    }
  };
  
  return (
    <AdminGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1">
          <Layout userRole={currentUser?.role || "admin"}>
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
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <UserManagementTable users={users} setUsers={setUsers} onReload={loadUsers} />
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
    </AdminGuard>
  );
};

export default UserManagement;
