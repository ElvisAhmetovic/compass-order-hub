
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import FormInput from "./FormInput";
import { validateFullName, validateEmail, validatePassword } from "@/utils/formValidation";

const RegisterForm = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{fullName?: string, email?: string, password?: string}>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFullName(value);
    
    const error = validateFullName(value);
    setErrors(prev => ({ ...prev, fullName: error }));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
    const error = validateEmail(value);
    setErrors(prev => ({ ...prev, email: error }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    
    const error = validatePassword(value);
    setErrors(prev => ({ ...prev, password: error }));
  };

  const isFormValid = () => {
    return !errors.fullName && !errors.email && !errors.password && 
           fullName.trim() !== "" && email.trim() !== "" && password.trim() !== "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      toast({
        variant: "destructive",
        title: "Form validation failed",
        description: "Please fix the errors above before submitting.",
      });
      return;
    }
    
    setIsLoading(true);

    try {
      // Split full name for first and last name
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      console.log('Attempting registration for:', email);

      // Register user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: fullName.trim(),
            role: 'user'
          }
        }
      });

      if (error) {
        console.error('Registration error:', error);
        
        let errorMessage = "There was a problem creating your account.";
        if (error.message.includes("already registered") || error.message.includes("already been registered")) {
          errorMessage = "An account with this email already exists. Please try logging in instead.";
        } else if (error.message.includes("Password")) {
          errorMessage = "Password must be at least 6 characters long.";
        } else if (error.message.includes("email")) {
          errorMessage = "Please enter a valid email address.";
        } else {
          errorMessage = error.message;
        }
        
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: errorMessage,
        });
        return;
      }

      if (data.user) {
        console.log('✅ User registered successfully:', data.user.id);
        
        // Check if email confirmation is required
        if (!data.session && data.user && !data.user.email_confirmed_at) {
          toast({
            title: "Registration successful",
            description: "Please check your email for a confirmation link before signing in.",
          });
        } else {
          toast({
            title: "Registration successful",
            description: "Your account has been created successfully.",
          });
        }
        
        navigate("/login");
      }
    } catch (error: any) {
      console.error('Unexpected registration error:', error);
      
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-[350px] mx-auto">
      <CardHeader>
        <CardTitle>Register</CardTitle>
        <CardDescription>Create a new account</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <FormInput
            id="fullName"
            label="Full Name"
            type="text"
            value={fullName}
            onChange={handleFullNameChange}
            placeholder="John Doe"
            disabled={isLoading}
            error={errors.fullName}
          />
          <FormInput
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="name@company.com"
            disabled={isLoading}
            error={errors.email}
          />
          <FormInput
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={handlePasswordChange}
            disabled={isLoading}
            error={errors.password}
            isPassword={true}
            showPassword={showPassword}
            toggleShowPassword={() => setShowPassword(!showPassword)}
          />
        </CardContent>
        <CardFooter className="flex flex-col">
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !isFormValid()}
          >
            {isLoading ? "Creating account..." : "Register"}
          </Button>
          <div className="mt-4 text-sm text-center">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-blue-600 hover:text-blue-800 hover:underline"
              onClick={(e) => {
                e.preventDefault();
                navigate("/login");
              }}
            >
              Login
            </a>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
};

export default RegisterForm;
