
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  fullName: z.string().min(2, {
    message: "Full name must be at least 2 characters.",
  }),
  role: z.enum(["user", "admin", "agent"] as const),
});

interface EditUserModalProps {
  user: User;
  open: boolean;
  onClose: () => void;
  onUpdate: (user: User) => void;
  canEditRole?: boolean;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  user,
  open,
  onClose,
  onUpdate,
  canEditRole = false,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: user.email,
      fullName: user.full_name,
      role: user.role,
    },
  });

  // Reset form when user changes
  useEffect(() => {
    form.reset({
      email: user.email,
      fullName: user.full_name,
      role: user.role,
    });
  }, [user, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      console.log('Updating user:', user.id, values);

      // Prevent role changes for main admin account
      if (user.email === "luciferbebistar@gmail.com" && values.role !== "admin") {
        toast({
          variant: "destructive",
          title: "Cannot change role",
          description: "The main administrator role cannot be changed."
        });
        setIsSubmitting(false);
        return;
      }

      const nameParts = values.fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Update the profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          role: canEditRole ? values.role : user.role,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw profileError;
      }

      console.log('Successfully updated profiles table');

      // Update user_permissions table if role changed
      if (canEditRole && values.role !== user.role) {
        console.log('Role changed, updating user_permissions for user:', user.id);
        
        if (values.role === 'admin') {
          // Grant all permissions for admin role
          const { error: permissionsError } = await supabase
            .from('user_permissions')
            .update({
              role: 'admin',
              dashboard_access: true,
              active_orders_view: true,
              active_orders_modify: true,
              complaints_view: true,
              complaints_modify: true,
              completed_view: true,
              completed_modify: true,
              cancelled_view: true,
              cancelled_modify: true,
              deleted_view: true,
              deleted_modify: true,
              invoice_sent_view: true,
              invoice_sent_modify: true,
              invoice_paid_view: true,
              invoice_paid_modify: true,
              companies_view: true,
              companies_modify: true,
              reviews_view: true,
              reviews_modify: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

          if (permissionsError) {
            console.error('Permissions update error:', permissionsError);
            // Don't throw - continue with profile update
            toast({
              variant: "destructive",
              title: "Warning",
              description: "User role updated but permissions may need manual adjustment."
            });
          } else {
            console.log('Successfully updated user_permissions to admin');
          }
        } else {
          // For non-admin roles, update role but keep limited permissions
          const { error: permissionsError } = await supabase
            .from('user_permissions')
            .update({
              role: values.role,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

          if (permissionsError) {
            console.error('Permissions role update error:', permissionsError);
          }
        }
      }

      // Update assigned_to_name in orders table if name changed
      if (values.fullName !== user.full_name) {
        console.log('Updating assigned_to_name in orders for user:', user.id);
        const { error: ordersError, data: updatedOrders } = await supabase
          .from('orders')
          .update({ 
            assigned_to_name: values.fullName,
            updated_at: new Date().toISOString()
          })
          .eq('assigned_to', user.id)
          .select();

        if (ordersError) {
          console.error('Orders update error:', ordersError);
          // Don't throw error - continue with profile update even if orders update fails
          toast({
            variant: "destructive",
            title: "Warning",
            description: "User profile updated but some order assignments may still show the old name."
          });
        } else {
          console.log('Successfully updated assigned_to_name in orders');
          
          // Sync affected orders to Google Sheets
          if (updatedOrders && updatedOrders.length > 0) {
            try {
              await supabase.functions.invoke('sync-order-to-sheets', {
                body: { orders: updatedOrders, syncType: 'batch-update' }
              });
              console.log(`Synced ${updatedOrders.length} orders to Google Sheets after user name update`);
            } catch (syncError) {
              console.error('Failed to sync orders to Google Sheets after user name update:', syncError);
              // Don't fail the user update if sync fails
            }
          }
        }
      }

      // Try to update email in auth system (this might fail due to permissions)
      if (values.email !== user.email) {
        try {
          const { error: emailError } = await supabase.auth.admin.updateUserById(
            user.id,
            { email: values.email }
          );
          
          if (emailError) {
            console.log('Could not update email in auth system:', emailError);
            // Don't throw error - continue with profile update
          } else {
            console.log('Successfully updated email in auth system');
          }
        } catch (error) {
          console.log('Email update not available:', error);
          // Continue without email update
        }
      }

      // Create updated user object with new values
      const updatedUser: User = {
        ...user,
        email: values.email, // Use the new email value
        full_name: values.fullName,
        role: canEditRole ? values.role : user.role,
        updated_at: new Date().toISOString()
      };

      // Pass updated user to parent component
      onUpdate(updatedUser);

      toast({
        title: "User updated",
        description: "User information has been updated successfully.",
      });

      onClose();
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast({
        variant: "destructive",
        title: "Failed to update user",
        description: error.message || "Something went wrong. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information. {!canEditRole && "Only the main admin can change user roles."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      {...field} 
                      disabled={user.email === "luciferbebistar@gmail.com"} // Prevent email change for main admin
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={!canEditRole || user.email === "luciferbebistar@gmail.com"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  {!canEditRole && (
                    <p className="text-sm text-muted-foreground">
                      Only the main admin can modify user roles.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary" disabled={isSubmitting}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
