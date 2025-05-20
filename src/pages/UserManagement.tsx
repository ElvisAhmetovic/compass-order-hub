
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import Sidebar from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { UserManagementTable } from "@/components/user-management/UserManagementTable";
import { AddUserModal } from "@/components/user-management/AddUserModal";
import { User, UserRole } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const UserManagement = () => {
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("app_users")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) {
        toast.error("Failed to fetch users");
        console.error("Error fetching users:", error);
        return;
      }
      
      setUsers(data.map(user => ({
        id: user.id,
        email: user.email,
        role: user.role as UserRole, // Cast to UserRole type
        created_at: user.created_at,
        full_name: user.full_name || "No Name"
      })));
    } catch (err) {
      console.error("Unexpected error fetching users:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  const handleAddUser = (newUser: User) => {
    setUsers(prevUsers => [newUser, ...prevUsers]);
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
            
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-lg">Loading users...</span>
              </div>
            ) : (
              <UserManagementTable users={users} setUsers={setUsers} onUsersChange={fetchUsers} />
            )}
            
            <AddUserModal 
              open={isAddUserModalOpen} 
              onClose={() => setIsAddUserModalOpen(false)}
              onAddUser={handleAddUser}
              onSuccess={fetchUsers}
            />
          </div>
        </Layout>
      </div>
    </div>
  );
};

export default UserManagement;
