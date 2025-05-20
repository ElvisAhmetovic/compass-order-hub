
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, AlertTriangle } from "lucide-react";

const LoginForm = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{identifier?: string, password?: string}>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  // List of offensive words to filter out
  const offensiveWords = ["racist", "offensive", "inappropriate", "slur"];

  const validateIdentifier = (value: string) => {
    // Check if it's an email
    const isEmail = value.includes('@');
    
    if (isEmail) {
      // Email validation - simple regex for email format
      const emailRegex = /^[a-zA-Z0-9]+([._-]?[a-zA-Z0-9]+)*@[a-zA-Z0-9]+([.-]?[a-zA-Z0-9]+)*(\.[a-zA-Z]{2,})+$/;
      if (!emailRegex.test(value)) {
        return "Please enter a valid email address.";
      }
    } else {
      // Username validation - only letters and numbers
      const usernameRegex = /^[a-zA-Z0-9]+$/;
      if (!usernameRegex.test(value)) {
        return "Username can only contain letters and numbers.";
      }
    }
    
    // Check for offensive words
    if (offensiveWords.some(word => value.toLowerCase().includes(word))) {
      return "This contains inappropriate language.";
    }
    
    return "";
  };

  const validatePassword = (value: string) => {
    if (value.length < 8) {
      return "Password must be at least 8 characters.";
    }
    
    if (!/[A-Z]/.test(value)) {
      return "Password must include at least one uppercase letter.";
    }
    
    if (!/[a-z]/.test(value)) {
      return "Password must include at least one lowercase letter.";
    }
    
    if (!/[0-9]/.test(value)) {
      return "Password must include at least one number.";
    }
    
    // Common password check (very basic implementation)
    const commonPasswords = ["password", "12345678", "qwerty123"];
    if (commonPasswords.includes(value.toLowerCase())) {
      return "This password is too common. Please choose a stronger one.";
    }
    
    return "";
  };

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setIdentifier(value);
    
    const error = validateIdentifier(value);
    setErrors(prev => ({ ...prev, identifier: error }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    
    const error = validatePassword(value);
    setErrors(prev => ({ ...prev, password: error }));
  };

  const isFormValid = () => {
    return !errors.identifier && !errors.password && identifier.trim() !== "" && password.trim() !== "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      return;
    }
    
    setIsLoading(true);

    // In a real app, this would connect to Supabase auth
    try {
      // Placeholder for Supabase authentication
      console.log("Login with", { identifier, password });
      
      // Simulate successful login
      toast({
        title: "Login successful",
        description: "Welcome back to Order Flow Compass",
      });
      navigate("/dashboard");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "Please check your credentials and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-[350px] mx-auto">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Enter your credentials to access your account</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="identifier" className="text-sm font-medium">Username or Email</label>
            <Input
              id="identifier"
              type="text"
              value={identifier}
              onChange={handleIdentifierChange}
              placeholder="johndoe or name@company.com"
              required
              disabled={isLoading}
              className={errors.identifier ? "border-destructive" : ""}
            />
            {errors.identifier && (
              <div className="text-sm text-destructive flex items-center gap-1 mt-1">
                <AlertTriangle className="h-4 w-4" />
                <span>{errors.identifier}</span>
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
            {isLoading ? "Logging in..." : "Login"}
          </Button>
          <div className="mt-4 text-sm text-center">
            Don't have an account?{" "}
            <a
              href="/register"
              className="text-blue-600 hover:text-blue-800 hover:underline"
              onClick={(e) => {
                e.preventDefault();
                navigate("/register");
              }}
            >
              Register
            </a>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
};

export default LoginForm;
