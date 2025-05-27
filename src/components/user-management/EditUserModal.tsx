
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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

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

      // Create updated user object
      const updatedUser: User = {
        ...user,
        email: values.email,
        full_name: values.fullName,
        role: canEditRole ? values.role : user.role, // Only allow role change if user has permission
        updated_at: new Date().toISOString()
      };

      // Pass updated user to parent component
      onUpdate(updatedUser);

      toast({
        title: "User updated",
        description: "User has been updated successfully.",
      });

      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to update user",
        description: "Something went wrong. Please try again later.",
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
