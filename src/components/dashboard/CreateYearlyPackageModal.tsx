import { useState } from "react";
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
  description: z.string().min(10, "Minimum 10 characters required"),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateYearlyPackageModalProps {
  open: boolean;
  onClose: () => void;
}

const CreateYearlyPackageModal = ({ open, onClose }: CreateYearlyPackageModalProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedInventoryItems, setSelectedInventoryItems] = useState<SelectedInventoryItem[]>([]);
  
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
    },
  });

  // Handle autofill from selected order
  const handleOrderAutofill = (selectedOrder: Order) => {
    form.setValue('companyName', selectedOrder.company_name);
    form.setValue('companyAddress', selectedOrder.company_address || '');
    form.setValue('contactEmail', selectedOrder.contact_email || '');
    form.setValue('contactPhone', selectedOrder.contact_phone || '');
    form.setValue('companyLink', selectedOrder.company_link || '');
    form.setValue('price', selectedOrder.price || 0);
    form.setValue('currency', selectedOrder.currency || 'EUR');
    form.setValue('priority', selectedOrder.priority || 'medium');
    form.setValue('description', selectedOrder.description || '');
    
    toast({
      title: "Order information filled",
      description: `Autofilled information from order: ${selectedOrder.company_name}`,
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
        description: "You must be logged in to create yearly packages.",
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

      // Create yearly package order data
      const orderData = {
        company_name: values.companyName.trim(),
        contact_email: values.contactEmail.trim(),
        contact_phone: values.contactPhone?.trim() || null,
        company_address: values.companyAddress?.trim() || null,
        company_link: formattedLink || null,
        description: values.description.trim(),
        inventory_items: selectedInventoryItems.length > 0 ? JSON.stringify(selectedInventoryItems) : null,
        price: values.price,
        currency: values.currency,
        status: "Created" as const,
        priority: values.priority as OrderPriority,
        created_by: user.id,
        is_yearly_package: true,
      };
      
      console.log('Creating yearly package order with data:', orderData);
      
      // Save the new yearly package order to Supabase
      await OrderService.createYearlyPackage(orderData);
      
      // Show success message
      toast({
        title: "Yearly package created successfully",
        description: `Created yearly package for ${values.companyName}`,
      });
      
      form.reset();
      setSelectedInventoryItems([]);
      onClose();
      
      // Trigger a refresh of the orders list
      window.dispatchEvent(new CustomEvent('orderStatusChanged'));
    } catch (error: any) {
      console.error("Error creating yearly package:", error);
      toast({
        variant: "destructive",
        title: "Error creating yearly package",
        description: error.message || "An error occurred while saving the yearly package. Please try again.",
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
          <DialogTitle className="text-xl font-semibold">Create New Yearly Package</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Fill in the details below to create a new yearly package order</p>
        
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
                <h3 className="text-base font-medium mb-2">Yearly Package Information</h3>
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
                            <FormLabel className="text-sm">Annual Price</FormLabel>
                            <span className="text-red-500">*</span>
                            <div className="ml-1 tooltip" title="Yearly package price before taxes">
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
                            Enter the total annual package amount
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
                          Set the priority level for this yearly package
                        </p>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Right Column - Inventory & Description */}
              <div className="space-y-4">
                {/* Inventory Items Section */}
                <InventoryItemsSelector
                  selectedItems={selectedInventoryItems}
                  onItemsChange={setSelectedInventoryItems}
                  className="w-full"
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-1">
                        <FormLabel className="text-sm">Package Description</FormLabel>
                        <span className="text-red-500">*</span>
                      </div>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the yearly package services and deliverables..." 
                          className="min-h-[120px]" 
                          {...field} 
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">
                        Minimum 10 characters required
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Yearly Package"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateYearlyPackageModal;
