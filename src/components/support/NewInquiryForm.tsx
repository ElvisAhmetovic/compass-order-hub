
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { SupportInquiry } from "@/types/support";

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

export const NewInquiryForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      // Create a new inquiry
      const newInquiry: SupportInquiry = {
        id: uuidv4(),
        userId: user.id,
        userEmail: user.email,
        userName: user.full_name || user.email,
        subject: values.subject,
        message: values.message,
        createdAt: new Date().toISOString(),
        status: "open",
        replies: [],
      };

      // Get existing inquiries from localStorage or initialize empty array
      const existingInquiries: SupportInquiry[] = JSON.parse(
        localStorage.getItem("supportInquiries") || "[]"
      );

      // Add new inquiry to the array
      const updatedInquiries = [newInquiry, ...existingInquiries];

      // Save back to localStorage
      localStorage.setItem("supportInquiries", JSON.stringify(updatedInquiries));

      // Show success toast
      toast({
        title: "Inquiry Submitted",
        description: "Your inquiry has been submitted to our support team.",
      });

      // Redirect to the support page
      navigate("/support");
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
