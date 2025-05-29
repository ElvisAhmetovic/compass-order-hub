
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
import { OrderPriority } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { OrderService } from "@/services/orderService";

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

interface CreateOrderModalProps {
  open: boolean;
  onClose: () => void;
}

const CreateOrderModal = ({ open, onClose }: CreateOrderModalProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
      // Create order data for Supabase
      const orderData = {
        company_name: values.companyName,
        contact_email: values.contactEmail,
        contact_phone: values.contactPhone,
        company_address: values.companyAddress,
        company_link: values.companyLink,
        description: values.description,
        price: values.price,
        currency: values.currency,
        status: "Created" as const,
        priority: values.priority as OrderPriority,
        created_by: user.id,
      };
      
      // Save the new order to Supabase
      await OrderService.createOrder(orderData);
      
      // Show success message
      toast({
        title: "Order created successfully",
        description: `Created order for ${values.companyName}`,
      });
      
      form.reset();
      onClose();
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        variant: "destructive",
        title: "Error creating order",
        description: "An error occurred while saving the order. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Updated priorities to use lowercase values to match the OrderPriority type
  const priorities: OrderPriority[] = ["low", "medium", "high", "urgent"];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create New Order</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Fill in the details below to create a new order</p>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <h3 className="text-base font-medium mb-2">Company Information</h3>
              <p className="text-sm text-muted-foreground mb-4">Fields marked with * are required</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                {/* Company Address */}
                <FormField
                  control={form.control}
                  name="companyAddress"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-1">
                        <FormLabel className="text-sm">Company Address</FormLabel>
                        <span className="text-red-500">*</span>
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
                          placeholder="https://example.com" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground mt-1">
                        Paste Google Maps, website, or Facebook page URL
                      </p>
                    </FormItem>
                  )}
                />

                {/* Price */}
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
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Priority */}
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem className="mt-4">
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
                            {priority}
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

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <div className="flex items-center gap-1">
                      <FormLabel className="text-sm">Description</FormLabel>
                      <span className="text-red-500">*</span>
                    </div>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what the company ordered..." 
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
