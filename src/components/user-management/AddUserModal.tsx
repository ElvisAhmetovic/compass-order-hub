import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { User, UserRole } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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

interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
  onAddUser: (user: User) => void;
  onSuccess: () => Promise<void>;
}

export const AddUserModal = ({ open, onClose, onAddUser, onSuccess }: AddUserModalProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast: uiToast } = useToast();

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

  const handleCreate = async () => {
    if (!email || !password) {
      toast.error("Email and password are required");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create a new user with a unique ID
      const { data, error } = await supabase
        .from("app_users")
        .insert({
          email,
          role,
          full_name: `${firstName} ${lastName}`.trim() || "No Name"
        })
        .select()
        .single();
        
      if (error) {
        toast.error("Failed to create user");
        console.error("Error creating user:", error);
        return;
      }
      
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
      
      console.log('New User:', data);
      console.log('Selected Permissions:', selectedPermissions);
      
      // Cast the role to UserRole before adding to the users list
      const typedUser: User = {
        ...data,
        role: data.role as UserRole
      };
      
      // Add the new user to the list
      onAddUser(typedUser);
      
      toast.success("User created successfully");
      await onSuccess();
      handleClose();
    } catch (err) {
      console.error("Unexpected error creating user:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
    setRole("user");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add User</DialogTitle>
          <DialogDescription>
            Create a new user account.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="role">Role</Label>
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
                        id={category.permissions.view.id}
                        checked={category.permissions.view.checked}
                        onCheckedChange={(checked) => 
                          handleTogglePermission(categoryIndex, 'view', checked as boolean)
                        }
                      />
                      <Label htmlFor={category.permissions.view.id} className="font-normal">
                        {category.permissions.view.name}
                      </Label>
                    </div>
                  )}
                  
                  {category.permissions.modify && (
                    <div className="flex items-center space-x-2 ml-6">
                      <Checkbox 
                        id={category.permissions.modify.id}
                        checked={category.permissions.modify.checked}
                        disabled={!category.permissions.view?.checked}
                        onCheckedChange={(checked) => 
                          handleTogglePermission(categoryIndex, 'modify', checked as boolean)
                        }
                      />
                      <Label htmlFor={category.permissions.modify.id} className="font-normal">
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
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create User"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
