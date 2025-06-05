
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
    
    // Only show error if user has started typing and field is not empty
    if (value.trim() !== "") {
      const error = validateFullName(value);
      setErrors(prev => ({ ...prev, fullName: error }));
    } else {
      setErrors(prev => ({ ...prev, fullName: undefined }));
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
    // Only show error if user has started typing and field is not empty
    if (value.trim() !== "") {
      const error = validateEmail(value);
      setErrors(prev => ({ ...prev, email: error }));
    } else {
      setErrors(prev => ({ ...prev, email: undefined }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    
    // Only show error if user has started typing and field is not empty
    if (value.trim() !== "") {
      const error = validatePassword(value);
      setErrors(prev => ({ ...prev, password: error }));
    } else {
      setErrors(prev => ({ ...prev, password: undefined }));
    }
  };

  const isFormValid = () => {
    // Check if all fields have values and no errors
    const hasAllFields = fullName.trim() !== "" && email.trim() !== "" && password.trim() !== "";
    const hasNoErrors = !errors.fullName && !errors.email && !errors.password;
    return hasAllFields && hasNoErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔵 Register button clicked');
    console.log('🔵 Form data:', { fullName: fullName.trim(), email: email.trim(), passwordLength: password.length });
    
    // Final validation before submission
    const fullNameError = validateFullName(fullName);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    if (fullNameError || emailError || passwordError) {
      console.log('❌ Form validation failed:', { fullNameError, emailError, passwordError });
      setErrors({
        fullName: fullNameError,
        email: emailError,
        password: passwordError
      });
      toast({
        variant: "destructive",
        title: "Form validation failed",
        description: "Please fix the errors above before submitting.",
      });
      return;
    }
    
    setIsLoading(true);
    console.log('🔵 Starting registration process...');

    try {
      // Split full name for first and last name
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      console.log('🔵 Calling supabase.auth.signUp with:', {
        email: email.trim(),
        firstName,
        lastName,
        fullName: fullName.trim()
      });

      // Register user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: fullName.trim()
          }
        }
      });

      console.log('🔵 Supabase signup response:', {
        user: data.user ? `User created with ID: ${data.user.id}` : 'No user',
        session: data.session ? 'Session created' : 'No session',
        error: error ? error.message : 'No error'
      });

      if (error) {
        console.error('❌ Registration error:', error);
        
        let errorMessage = "There was a problem creating your account.";
        
        // Handle specific error messages
        if (error.message.includes("User already registered") || error.message.includes("already been registered")) {
          errorMessage = "An account with this email already exists. Please try logging in instead.";
        } else if (error.message.includes("Invalid email")) {
          errorMessage = "Please enter a valid email address.";
        } else if (error.message.includes("Password should be at least")) {
          errorMessage = "Password must be at least 6 characters long.";
        } else if (error.message.includes("signup is disabled")) {
          errorMessage = "Registration is currently disabled. Please contact support.";
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
        console.log('✅ User registered successfully:', {
          userId: data.user.id,
          email: data.user.email,
          emailConfirmed: data.user.email_confirmed_at,
          hasSession: !!data.session
        });
        
        // Check if email confirmation is required
        if (!data.session && data.user && !data.user.email_confirmed_at) {
          console.log('📧 Email confirmation required');
          toast({
            title: "Registration successful!",
            description: "Please check your email for a confirmation link to complete your registration.",
          });
          navigate("/login");
        } else {
          console.log('✅ User logged in automatically');
          toast({
            title: "Registration successful!",
            description: "Welcome! Your account has been created successfully.",
          });
          navigate("/dashboard");
        }
      } else {
        console.error('❌ No user data returned from signup');
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: "Registration failed. Please try again.",
        });
      }
    } catch (error: any) {
      console.error('❌ Unexpected registration error:', error);
      
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
      console.log('🔵 Registration process completed');
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
            placeholder="Enter your password"
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
