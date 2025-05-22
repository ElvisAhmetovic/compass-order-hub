
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from "@/context/SupabaseAuthContext";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface RegisterFormProps {
  onSuccess: () => void;
}

const registerSchema = z.object({
  fullName: z.string().min(2, {
    message: "Full name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { signUp } = useSupabaseAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
    },
  });

  const handleRegister = async (data: RegisterFormValues) => {
    setServerError(null);
    setIsRegistering(true);
    
    try {
      console.log("Register attempt with:", { email: data.email, fullName: data.fullName });
      const result = await signUp(data.email, data.password, data.fullName);
      
      if (!result.success) {
        console.error("Registration error:", result.error);
        setServerError(result.error || "Registration failed. Please try again.");
      } else {
        console.log("Registration successful!");
        setIsSuccess(true);
        toast({
          title: "Account Created",
          description: "Check your email for a confirmation link.",
        });
        
        // Note for development: In supabase dashboard, you might want to disable email confirmation
        console.log("Development note: You may want to disable email confirmation in Supabase dashboard");
        
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (error) {
      console.error("Unexpected error during registration:", error);
      setServerError("An unexpected error occurred. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div>
      {serverError && (
        <div className="flex items-center gap-2 p-3 mb-4 text-sm border rounded-md border-destructive/50 bg-destructive/10 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{serverError}</span>
        </div>
      )}
      
      {isSuccess && (
        <div className="flex items-center gap-2 p-3 mb-4 text-sm border rounded-md border-green-500/50 bg-green-500/10 text-green-500">
          <CheckCircle className="h-4 w-4" />
          <span>Account created successfully! You can now log in.</span>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleRegister)} className="space-y-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="John Doe" 
                    disabled={isRegistering || isSuccess} 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="name@example.com" 
                    disabled={isRegistering || isSuccess} 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    disabled={isRegistering || isSuccess} 
                    {...field}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  Password must be at least 6 characters long
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isRegistering || isSuccess}
          >
            {isRegistering ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Account Created
              </>
            ) : "Create Account"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
