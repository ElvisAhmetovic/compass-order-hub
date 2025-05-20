
import { useState } from "react";
import Layout from "@/components/layout/Layout";
import Sidebar from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { UserManagementTable } from "@/components/user-management/UserManagementTable";
import { AddUserModal } from "@/components/user-management/AddUserModal";
import { User } from "@/types";

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

const UserManagement = () => {
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [users, setUsers] = useState<User[]>(mockUsers);
  
  const handleAddUser = (newUser: User) => {
    setUsers([...users, newUser]);
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
            
            <UserManagementTable users={users} setUsers={setUsers} />
            
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
