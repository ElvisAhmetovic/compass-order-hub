
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
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
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to submit an inquiry.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get user display name with fallbacks
      const userName = user.full_name || user.email || "Unknown User";
      
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
