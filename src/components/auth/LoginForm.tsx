import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import FormInput from "./FormInput";
import { useAuth } from "@/context/AuthContext";
import { validateEmail, validatePassword } from "@/utils/formValidation";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{email?: string, password?: string, auth?: string}>({});
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
    const error = validateEmail(value);
    setErrors(prev => ({ ...prev, email: error, auth: undefined }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    
    const error = validatePassword(value);
    setErrors(prev => ({ ...prev, password: error, auth: undefined }));
  };

  const isFormValid = () => {
    return !errors.email && !errors.password && email.trim() !== "" && password.trim() !== "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any previous auth errors
    setErrors(prev => ({ ...prev, auth: undefined }));
    
    // Validate form before submitting
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    if (emailError || passwordError) {
      setErrors({
        email: emailError,
        password: passwordError
      });
      return;
    }

    try {
      console.log(`Attempting to log in with: ${email}`);
      const success = await login(email, password);
      
      if (!success) {
        setErrors(prev => ({ ...prev, auth: "Invalid email or password" }));
      }
      // If success, Login.tsx's useEffect will handle redirect once AuthContext updates
    } catch (error) {
      console.error("Login error:", error);
      setErrors(prev => ({ ...prev, auth: "An unexpected error occurred." }));
    }
  };

  return (
    <Card className="w-[350px] mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <img 
            src="/lovable-uploads/2d4259f4-7fb1-4221-9e23-4bec4378d055.png" 
            alt="AB Media Team Logo" 
            className="h-14 w-auto"
          />
        </div>
        <CardTitle>Login</CardTitle>
        <CardDescription>Enter your credentials to access your account</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {errors.auth && (
            <div className="p-3 rounded-md bg-destructive/15 text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-4" />
              <span>{errors.auth}</span>
            </div>
          )}
          
          <FormInput
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="name@company.com"
            error={errors.email}
            disabled={isLoading}
          />
          
          <FormInput
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={handlePasswordChange}
            error={errors.password}
            disabled={isLoading}
            isPassword
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
