
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
      console.log('Loading users from profiles table...');
      
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role, updated_at')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Profiles data:', profiles);

      // Get user emails from auth.users via a separate query
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.warn('Could not fetch auth users:', authError.message);
      }

      // Convert profiles to User format
      const formattedUsers: User[] = profiles.map(profile => {
        // Try to find matching auth user for email
        const authUser = authUsers?.users?.find(u => u.id === profile.id);
        
        return {
          id: profile.id,
          email: authUser?.email || 'No email available',
          role: profile.role,
          full_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'No Name',
          created_at: authUser?.created_at || new Date().toISOString(),
          updated_at: profile.updated_at || new Date().toISOString()
        };
      });

      console.log('Formatted users:', formattedUsers);
      setUsers(formattedUsers);
    } catch (error) {
      console.error("Error loading users:", error);
      toast({
        variant: "destructive",
        title: "Error loading users",
        description: error.message || "Could not load the user data from database."
      });
      
      // Set empty array on error to prevent infinite loading
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);
  
  const handleAddUser = async (newUser: User) => {
    try {
      console.log('Adding new user:', newUser);
      
      // In a real implementation, you'd use Supabase Admin API or invite system
      // For now, we'll just add to profiles table (assuming auth user already exists)
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
        description: error.message || "Could not add the new user to database."
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
              ) : users.length === 0 ? (
                <div className="text-center p-8">
                  <p className="text-muted-foreground">No users found in the database.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Users will appear here after they sign up or are added to the system.
                  </p>
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
