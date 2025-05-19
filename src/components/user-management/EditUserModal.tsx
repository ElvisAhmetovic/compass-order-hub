
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { User, UserRole } from "@/types";

interface Permission {
  id: string;
  name: string;
  checked: boolean;
}

type PermissionCategory = {
  section: string;
  permissions: {
    view: Permission;
    modify?: Permission;
  };
};

interface EditUserModalProps {
  user: User;
  open: boolean;
  onClose: () => void;
  onUpdate: (user: User) => void;
}

export const EditUserModal = ({ user, open, onClose, onUpdate }: EditUserModalProps) => {
  const [email, setEmail] = useState(user.email);
  const [firstName, setFirstName] = useState(user.full_name?.split(" ")[0] || "");
  const [lastName, setLastName] = useState(user.full_name?.split(" ")[1] || "");
  const [role, setRole] = useState<UserRole>(user.role);
  const [permissionCategories, setPermissionCategories] = useState<PermissionCategory[]>([
    {
      section: "Active Orders",
      permissions: {
        view: { id: "active_orders_view", name: "Active Orders View", checked: true },
        modify: { id: "active_orders_modify", name: "Active Orders Modify", checked: true }
      }
    },
    {
      section: "Complaints",
      permissions: {
        view: { id: "complaints_view", name: "Complaints View", checked: true },
        modify: { id: "complaints_modify", name: "Complaints Modify", checked: true }
      }
    },
    {
      section: "Completed",
      permissions: {
        view: { id: "completed_view", name: "Completed View", checked: true },
        modify: { id: "completed_modify", name: "Completed Modify", checked: true }
      }
    },
    {
      section: "Cancelled",
      permissions: {
        view: { id: "cancelled_view", name: "Cancelled View", checked: true },
        modify: { id: "cancelled_modify", name: "Cancelled Modify", checked: true }
      }
    },
    {
      section: "Invoice Sent",
      permissions: {
        view: { id: "invoice_sent_view", name: "Invoice Sent View", checked: true },
        modify: { id: "invoice_sent_modify", name: "Invoice Sent Modify", checked: true }
      }
    },
    {
      section: "Invoice Paid",
      permissions: {
        view: { id: "invoice_paid_view", name: "Invoice Paid View", checked: true },
        modify: { id: "invoice_paid_modify", name: "Invoice Paid Modify", checked: true }
      }
    },
    {
      section: "Deleted",
      permissions: {
        view: { id: "deleted_view", name: "Deleted View", checked: true },
        modify: { id: "deleted_modify", name: "Deleted Modify", checked: false }
      }
    },
    {
      section: "Reviews",
      permissions: {
        view: { id: "reviews_view", name: "Reviews View", checked: true },
        modify: { id: "reviews_modify", name: "Reviews Modify", checked: true }
      }
    },
    {
      section: "Companies",
      permissions: {
        view: { id: "companies_view", name: "Companies View", checked: true },
        modify: { id: "companies_modify", name: "Companies Modify", checked: true }
      }
    },
    {
      section: "Dashboard",
      permissions: {
        view: { id: "dashboard_access", name: "Dashboard Access", checked: true }
      }
    }
  ]);

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      const nameParts = user.full_name?.split(" ") || ["", ""];
      setFirstName(nameParts[0] || "");
      setLastName(nameParts.slice(1).join(" ") || "");
      setRole(user.role);
      
      // Here you would typically fetch the user's permissions from your backend
      // and update the permissionCategories state
    }
  }, [user]);

  const handleTogglePermission = (categoryIndex: number, permissionType: 'view' | 'modify', checked: boolean) => {
    const updatedCategories = [...permissionCategories];
    if (permissionType === 'view' && updatedCategories[categoryIndex].permissions.view) {
      updatedCategories[categoryIndex].permissions.view.checked = checked;
      
      // If view is unchecked, also uncheck modify
      if (!checked && updatedCategories[categoryIndex].permissions.modify) {
        updatedCategories[categoryIndex].permissions.modify.checked = false;
      }
    }
    
    if (permissionType === 'modify' && updatedCategories[categoryIndex].permissions.modify) {
      updatedCategories[categoryIndex].permissions.modify.checked = checked;
      
      // If modify is checked, also check view
      if (checked && updatedCategories[categoryIndex].permissions.view) {
        updatedCategories[categoryIndex].permissions.view.checked = true;
      }
    }
    
    setPermissionCategories(updatedCategories);
  };

  const handleUpdate = () => {
    // Here you would typically send this data to your backend
    const updatedUser: User = {
      ...user,
      email,
      role,
      full_name: `${firstName} ${lastName}`.trim() || "No Name"
    };
    
    // Get all selected permissions
    const selectedPermissions = permissionCategories.flatMap(category => {
      const permissions = [];
      if (category.permissions.view?.checked) {
        permissions.push(category.permissions.view.id);
      }
      if (category.permissions.modify?.checked) {
        permissions.push(category.permissions.modify.id);
      }
      return permissions;
    });
    
    console.log('Updated User:', updatedUser);
    console.log('Selected Permissions:', selectedPermissions);
    
    onUpdate(updatedUser);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information and permissions.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="edit-firstName">First Name</Label>
            <Input
              id="edit-firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="edit-lastName">Last Name</Label>
            <Input
              id="edit-lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="edit-role">Role</Label>
            <Select value={role} onValueChange={(value: UserRole) => setRole(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2 mt-4">
            <Label>Permissions</Label>
            <div className="space-y-4 max-h-[300px] overflow-y-auto border rounded-md p-4">
              {permissionCategories.map((category, categoryIndex) => (
                <div key={category.section} className="space-y-2">
                  {category.permissions.view && (
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id={`edit-${category.permissions.view.id}`}
                        checked={category.permissions.view.checked}
                        onCheckedChange={(checked) => 
                          handleTogglePermission(categoryIndex, 'view', checked as boolean)
                        }
                      />
                      <Label htmlFor={`edit-${category.permissions.view.id}`} className="font-normal">
                        {category.permissions.view.name}
                      </Label>
                    </div>
                  )}
                  
                  {category.permissions.modify && (
                    <div className="flex items-center space-x-2 ml-6">
                      <Checkbox 
                        id={`edit-${category.permissions.modify.id}`}
                        checked={category.permissions.modify.checked}
                        disabled={!category.permissions.view?.checked}
                        onCheckedChange={(checked) => 
                          handleTogglePermission(categoryIndex, 'modify', checked as boolean)
                        }
                      />
                      <Label htmlFor={`edit-${category.permissions.modify.id}`} className="font-normal">
                        {category.permissions.modify.name}
                      </Label>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleUpdate}>
            Update User
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
