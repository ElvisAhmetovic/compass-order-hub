
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { useSupabaseAuth } from "@/context/SupabaseAuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

const formSchema = z.object({
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type FormValues = z.infer<typeof formSchema>;

interface NewInquiryFormProps {
  onSuccessfulSubmit?: () => void;
}

export const NewInquiryForm = ({ onSuccessfulSubmit }: NewInquiryFormProps) => {
  // Try both auth contexts to ensure we have a user
  const { user: authUser } = useAuth();
  const { user: supabaseUser } = useSupabaseAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Use either authUser or supabaseUser, whichever is available
  const user = supabaseUser || authUser;

  console.log("NewInquiryForm - Auth User:", authUser);
  console.log("NewInquiryForm - Supabase User:", supabaseUser);
  console.log("NewInquiryForm - Combined User:", user);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    // Debug user state
    console.log("Current user state:", user);
    
    if (!user) {
      console.error("User not authenticated in form submission");
      toast({
        title: "Error",
        description: "You must be logged in to submit an inquiry.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get user display name with type-safe access
      // Use a more robust approach to extract username that works with both auth contexts
      let userName = "Unknown User";
      
      // Log user object to help with debugging type structure
      console.log("User object structure:", JSON.stringify(user, null, 2));
      
      // Type-safe way to check if user_metadata exists and access its properties
      // Use type assertion to tell TypeScript that user may have these properties
      const metadata = (user as any).user_metadata;
      
      if (metadata && typeof metadata === 'object') {
        if (typeof metadata.full_name === 'string') {
          userName = metadata.full_name;
        } else if (typeof metadata.name === 'string') {
          userName = metadata.name;
        }
      }
      
      // If we still don't have a name, try direct properties
      if (userName === "Unknown User") {
        // Try various properties that might exist on different user objects
        const fullName = (user as any).full_name;
        const name = (user as any).name;
        const email = user.email;
        
        if (typeof fullName === 'string') userName = fullName;
        else if (typeof name === 'string') userName = name;
        else if (typeof email === 'string') userName = email;
      }
      
      console.log("Submitting inquiry with user:", {
        userId: user.id,
        userEmail: user.email,
        userName,
      });
      
      // Create a new inquiry in Supabase
      const { error } = await supabase
        .from('support_inquiries')
        .insert({
          user_id: user.id,
          user_email: user.email,
          user_name: userName,
          subject: values.subject,
          message: values.message,
          status: 'open'
        });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      // Show success toast
      toast({
        title: "Inquiry Submitted",
        description: "Your inquiry has been submitted to our support team.",
      });

      // Call the onSuccessfulSubmit callback if provided
      if (onSuccessfulSubmit) {
        onSuccessfulSubmit();
      }
      
      // Reset the form
      form.reset();
    } catch (error) {
      console.error("Error submitting inquiry:", error);
      toast({
        title: "Error",
        description: "There was a problem submitting your inquiry.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject</FormLabel>
              <FormControl>
                <Input placeholder="Enter the subject of your inquiry" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe your inquiry in detail" 
                  className="min-h-[150px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Inquiry"}
        </Button>
      </form>
    </Form>
  );
};
