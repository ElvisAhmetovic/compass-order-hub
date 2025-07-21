import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Info } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { OrderPriority, Order } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { OrderService } from "@/services/orderService";
import { supabase } from "@/integrations/supabase/client";
import OrderSearchDropdown from "./OrderSearchDropdown";
import InventoryItemsSelector, { SelectedInventoryItem } from "./InventoryItemsSelector";

const formSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  companyAddress: z.string().optional(),
  contactEmail: z.string().email("Invalid email address"),
  contactPhone: z.string().optional(),
  companyLink: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  currency: z.string().default("EUR"),
  priority: z.string().default("medium"),
  description: z.string().optional(),
  internalNotes: z.string().optional(),
  assignedTo: z.string().optional(),
  notificationEmails: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateOrderModalProps {
  open: boolean;
  onClose: () => void;
}

interface User {
  id: string;
  full_name: string;
  email: string;
}

const CreateOrderModal = ({ open, onClose }: CreateOrderModalProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedInventoryItems, setSelectedInventoryItems] = useState<SelectedInventoryItem[]>([]);
  const [notificationEmails, setNotificationEmails] = useState<string[]>(['']);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      companyAddress: "",
      contactEmail: "",
      contactPhone: "",
      companyLink: "",
      price: 0,
      currency: "EUR",
      priority: "medium",
      description: "",
      internalNotes: "",
      assignedTo: user?.id || "",
      notificationEmails: "",
    },
  });

  // Load available users for assignment
  useEffect(() => {
    const loadUsers = async () => {
      if (!open) return;
      
      setLoadingUsers(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .order('first_name');
        
        if (error) {
          console.error('Error loading users:', error);
          return;
        }
        
        const formattedUsers = data.map(profile => ({
          id: profile.id,
          full_name: `${profile.first_name} ${profile.last_name}`.trim() || 'Unknown User',
          email: '' // We don't have email in profiles, but keeping the interface
        }));
        
        setUsers(formattedUsers);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };
    
    loadUsers();
  }, [open]);

  // Reset form when modal opens and set default assigned user
  useEffect(() => {
    if (open && user) {
      form.setValue('assignedTo', user.id);
      setSelectedInventoryItems([]);
      setNotificationEmails(['']);
    }
  }, [open, user, form]);

  // Handle autofill from selected order - only copy company/client information, not order-specific content
  const handleOrderAutofill = (selectedOrder: Order) => {
    // Only copy company/client information and basic settings
    form.setValue('companyName', selectedOrder.company_name);
    form.setValue('companyAddress', selectedOrder.company_address || '');
    form.setValue('contactEmail', selectedOrder.contact_email || '');
    form.setValue('contactPhone', selectedOrder.contact_phone || '');
    form.setValue('companyLink', selectedOrder.company_link || '');
    form.setValue('currency', selectedOrder.currency || 'EUR');
    form.setValue('priority', selectedOrder.priority || 'medium');
    
    // Reset order-specific content to empty for new order
    form.setValue('price', 0);
    form.setValue('description', '');
    form.setValue('internalNotes', '');
    
    // Reset inventory items for new order
    setSelectedInventoryItems([]);
    
    // Reset notification emails for new order
    setNotificationEmails(['']);
    
    toast({
      title: "Company information filled",
      description: `Autofilled company details from: ${selectedOrder.company_name}. You can now add specific details for this new order.`,
    });
  };

  // Validate and format URL
  const formatUrl = (url: string): string => {
    if (!url) return url;
    
    // Remove any existing protocol
    let cleanUrl = url.replace(/^https?:\/\//, '');
    
    // Add https protocol
    return `https://${cleanUrl}`;
  };

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "You must be logged in to create orders.",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Format and validate the company link
      let formattedLink = '';
      if (values.companyLink) {
        formattedLink = formatUrl(values.companyLink);
        console.log('Formatted company link:', formattedLink);
      }

      // Find assigned user name
      const assignedUser = users.find(u => u.id === values.assignedTo);
      const assignedToName = assignedUser?.full_name || (values.assignedTo === user.id ? user.full_name : '');

      // Create order data for Supabase
      const orderData = {
        company_name: values.companyName.trim(),
        contact_email: values.contactEmail.trim(),
        contact_phone: values.contactPhone?.trim() || null,
        company_address: values.companyAddress?.trim() || null,
        company_link: formattedLink || null,
        description: values.description?.trim() || "",
        internal_notes: values.internalNotes?.trim() || null,
        inventory_items: selectedInventoryItems.length > 0 ? JSON.stringify(selectedInventoryItems) : null,
        price: values.price,
        currency: values.currency,
        status: "Created" as const,
        priority: values.priority as OrderPriority,
        created_by: user.id,
        assigned_to: values.assignedTo || user.id,
        assigned_to_name: assignedToName,
      };
      
      console.log('Creating order with data:', orderData);
      
      // Save the new order to Supabase
      const { data: orderResult, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (orderError) {
        throw orderError;
      }

      console.log('Order created successfully:', orderResult);

      // Send notification emails if any are provided
      const validEmails = notificationEmails.filter(email => 
        email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      );

      if (validEmails.length > 0) {
        try {
          console.log('Attempting to send order confirmation emails to:', validEmails);
          
          // Prepare the payload for the edge function
          const emailPayload = {
            orderData: {
              ...orderData,
              id: orderResult.id,
              created_at: orderResult.created_at
            },
            emails: validEmails,
            assignedToName,
            selectedInventoryItems
          };

          console.log('Email payload:', emailPayload);

          // Call the edge function with proper error handling
          const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-order-confirmation', {
            body: emailPayload
          });

          if (emailError) {
            console.error('Error calling send-order-confirmation function:', emailError);
            toast({
              variant: "destructive",
              title: "Email sending failed",
              description: `Order was created successfully but confirmation emails could not be sent: ${emailError.message}`,
            });
          } else {
            console.log('Order confirmation emails sent successfully:', emailResult);
            toast({
              title: "Order created and emails sent",
              description: `Created order for ${values.companyName} and sent notifications to ${validEmails.length} email(s).`,
            });
          }
        } catch (emailError: any) {
          console.error('Exception while sending notification emails:', emailError);
          toast({
            variant: "destructive",
            title: "Email sending failed",
            description: `Order was created successfully but confirmation emails could not be sent: ${emailError.message || 'Unknown error'}`,
          });
        }
      } else {
        // Show success message for order creation without emails
        toast({
          title: "Order created successfully",
          description: `Created order for ${values.companyName}${assignedToName ? ` and assigned to ${assignedToName}` : ''}`,
        });
      }
      
      form.reset();
      setSelectedInventoryItems([]);
      setNotificationEmails(['']);
      onClose();
      
      // Trigger a refresh of the orders list
      window.dispatchEvent(new CustomEvent('orderStatusChanged'));
    } catch (error: any) {
      console.error("Error creating order:", error);
      toast({
        variant: "destructive",
        title: "Error creating order",
        description: error.message || "An error occurred while saving the order. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorities: OrderPriority[] = ["low", "medium", "high", "urgent"];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create New Order</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Fill in the details below to create a new order</p>
        
        {/* Order Search Dropdown */}
        <div className="mb-4">
          <OrderSearchDropdown 
            onOrderSelect={handleOrderAutofill}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Select an existing order to autofill the form with its information
          </p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Company Information */}
              <div>
                <h3 className="text-base font-medium mb-2">Company Information</h3>
                <p className="text-sm text-muted-foreground mb-4">Fields marked with * are required</p>
                
                <div className="space-y-4">
                  {/* Company Name */}
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-1">
                          <FormLabel className="text-sm">Company Name</FormLabel>
                          <span className="text-red-500">*</span>
                        </div>
                        <FormControl>
                          <Input placeholder="Enter company name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Contact Email */}
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-1">
                          <FormLabel className="text-sm">Contact Email</FormLabel>
                          <span className="text-red-500">*</span>
                        </div>
                        <FormControl>
                          <Input type="email" placeholder="Email Address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Company Address */}
                  <FormField
                    control={form.control}
                    name="companyAddress"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-1">
                          <FormLabel className="text-sm">Company Address</FormLabel>
                          <div className="ml-1 tooltip" title="Company's physical address">
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                        <FormControl>
                          <Input placeholder="Full Address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Contact Phone */}
                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-1">
                          <FormLabel className="text-sm">Contact Phone</FormLabel>
                          <div className="ml-1 tooltip" title="International format preferred">
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                        <FormControl>
                          <Input placeholder="Phone Number (e.g. +43 1234567890)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Company Link */}
                  <FormField
                    control={form.control}
                    name="companyLink"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-1">
                          <FormLabel className="text-sm">Company Link</FormLabel>
                          <div className="ml-1 tooltip" title="Website or social media page">
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                        <FormControl>
                          <Input 
                            placeholder="example.com or maps.google.com/..." 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground mt-1">
                          Enter website URL, Google Maps link, or social media page (https:// will be added automatically)
                        </p>
                      </FormItem>
                    )}
                  />

                  {/* Price and Currency */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center gap-1">
                            <FormLabel className="text-sm">Price</FormLabel>
                            <span className="text-red-500">*</span>
                            <div className="ml-1 tooltip" title="Order price before taxes">
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0" 
                              min="0"
                              step="0.01"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground mt-1">
                            Enter the total order amount
                          </p>
                        </FormItem>
                      )}
                    />

                    {/* Currency */}
                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center gap-1">
                            <FormLabel className="text-sm">Currency</FormLabel>
                            <span className="text-red-500">*</span>
                          </div>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="EUR">EUR (€)</SelectItem>
                              <SelectItem value="USD">USD ($)</SelectItem>
                              <SelectItem value="GBP">GBP (£)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Priority */}
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Priority</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {priorities.map((priority) => (
                              <SelectItem key={priority} value={priority}>
                                {priority.charAt(0).toUpperCase() + priority.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          Set the priority level for this order
                        </p>
                      </FormItem>
                    )}
                  />

                  {/* Assign To */}
                  <FormField
                    control={form.control}
                    name="assignedTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Assign To</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={loadingUsers}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={loadingUsers ? "Loading users..." : "Select user to assign"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {users.map((assignUser) => (
                              <SelectItem key={assignUser.id} value={assignUser.id}>
                                {assignUser.full_name}
                                {assignUser.id === user?.id && " (You)"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          Order will be assigned to the selected user (defaults to you)
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Right Column - Inventory & Descriptions */}
              <div className="space-y-4">
                {/* Inventory Items Section */}
                <InventoryItemsSelector
                  selectedItems={selectedInventoryItems}
                  onItemsChange={setSelectedInventoryItems}
                  className="w-full"
                />

                {/* Client-facing Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-1">
                        <FormLabel className="text-sm">Client Description</FormLabel>
                        <div className="ml-1 tooltip" title="This description will appear in proposals and invoices">
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <FormControl>
                        <Textarea 
                          placeholder={`Description that will be visible to clients in proposals/invoices...

Example formatting:
1. First item or step
2. Second item or step
3. Third item or step

Key features:
• Feature one
• Feature two
• Feature three

Additional details in new paragraphs...`}
                          className="min-h-[120px]"
                          {...field} 
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">
                        This description will be included in proposals and invoices. Use line breaks for better formatting. Press Enter twice for new paragraphs.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Internal Notes */}
                <FormField
                  control={form.control}
                  name="internalNotes"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-1">
                        <FormLabel className="text-sm">Internal Notes</FormLabel>
                        <div className="ml-1 tooltip" title="These notes are for internal use only">
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <FormControl>
                        <Textarea 
                          placeholder={`Internal notes and comments (not visible to clients)...

Example formatting:
1. First priority task
2. Second priority task
3. Follow-up needed

Notes:
• Client prefers email contact
• Payment terms: Net 30
• Special requirements noted

Additional internal comments...`}
                          className="min-h-[120px]"
                          {...field} 
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">
                        These notes are for internal use only and won't appear in proposals or invoices. Use line breaks for better formatting. Press Enter twice for new paragraphs.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email Notifications */}
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <FormLabel className="text-sm">Email Notifications</FormLabel>
                    <div className="ml-1 tooltip" title="Send order confirmation to these email addresses">
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    {notificationEmails.map((email, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          type="email"
                          placeholder="email@example.com"
                          value={email}
                          onChange={(e) => {
                            const newEmails = [...notificationEmails];
                            newEmails[index] = e.target.value;
                            setNotificationEmails(newEmails);
                          }}
                          className="flex-1"
                        />
                        {notificationEmails.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newEmails = notificationEmails.filter((_, i) => i !== index);
                              setNotificationEmails(newEmails);
                            }}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setNotificationEmails([...notificationEmails, ''])}
                      className="w-full"
                    >
                      Add Another Email
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Order confirmation will be sent to these email addresses with all order details
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Order"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateOrderModal;
