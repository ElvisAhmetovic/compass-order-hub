
import { useState } from "react";
import Layout from "@/components/layout/Layout";
import Sidebar from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { UserManagementTable } from "@/components/user-management/UserManagementTable";
import { AddUserModal } from "@/components/user-management/AddUserModal";
import { User } from "@/types";

const UserManagement = () => {
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  
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
            
            <UserManagementTable />
            
            <AddUserModal 
              open={isAddUserModalOpen} 
              onClose={() => setIsAddUserModalOpen(false)}
            />
          </div>
        </Layout>
      </div>
    </div>
  );
};

export default UserManagement;
