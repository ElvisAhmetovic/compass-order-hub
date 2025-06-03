
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, AlertTriangle } from "lucide-react";
import { validateFullName, validateIdentifier, validatePassword } from "@/utils/formValidation";
import { supabase } from "@/integrations/supabase/client";

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
    
    const error = validateIdentifier(value);
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
        throw error;
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
      console.error('Registration error:', error);
      
      let errorMessage = "There was a problem creating your account.";
      if (error.message) {
        if (error.message.includes("already registered") || error.message.includes("already been registered")) {
          errorMessage = "An account with this email already exists. Please try logging in instead.";
        } else if (error.message.includes("password")) {
          errorMessage = "Password does not meet requirements. Please ensure it's at least 8 characters with uppercase, lowercase, and numbers.";
        } else if (error.message.includes("email")) {
          errorMessage = "Please enter a valid email address.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: errorMessage,
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
          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium">Full Name</label>
            <Input
              id="fullName"
              value={fullName}
              onChange={handleFullNameChange}
              placeholder="John Doe"
              required
              disabled={isLoading}
              className={errors.fullName ? "border-destructive" : ""}
            />
            {errors.fullName && (
              <div className="text-sm text-destructive flex items-center gap-1 mt-1">
                <AlertTriangle className="h-4 w-4" />
                <span>{errors.fullName}</span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="name@company.com"
              required
              disabled={isLoading}
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && (
              <div className="text-sm text-destructive flex items-center gap-1 mt-1">
                <AlertTriangle className="h-4 w-4" />
                <span>{errors.email}</span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={handlePasswordChange}
                required
                disabled={isLoading}
                className={errors.password ? "border-destructive pr-10" : "pr-10"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <div className="text-sm text-destructive flex items-center gap-1 mt-1">
                <AlertTriangle className="h-4 w-4" />
                <span>{errors.password}</span>
              </div>
            )}
          </div>
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
