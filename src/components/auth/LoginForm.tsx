
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import FormInput from "./FormInput";
import { validateIdentifier, validatePassword } from "@/utils/formValidation";
import { useAuth } from "@/context/AuthContext";

const LoginForm = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{identifier?: string, password?: string, auth?: string}>({});
  const navigate = useNavigate();
  const { login, isLoading: authLoading } = useAuth();
  
  const isLoading = isSubmitting || authLoading;

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setIdentifier(value);
    
    const error = validateIdentifier(value);
    setErrors(prev => ({ ...prev, identifier: error, auth: undefined }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    
    const error = validatePassword(value);
    setErrors(prev => ({ ...prev, password: error, auth: undefined }));
  };

  const isFormValid = () => {
    return !errors.identifier && !errors.password && identifier.trim() !== "" && password.trim() !== "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      return;
    }
    
    setIsSubmitting(true);
    setErrors({});

    try {
      console.log(`Attempting to log in with: ${identifier}, password: ${password.replace(/./g, '*')}`);
      const success = await login(identifier, password);
      
      if (success) {
        navigate("/dashboard");
      } else {
        setErrors(prev => ({ ...prev, auth: "Invalid email/username or password" }));
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrors(prev => ({ ...prev, auth: "An unexpected error occurred." }));
    } finally {
      setIsSubmitting(false);
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
          {/* Authentication error message */}
          {errors.auth && (
            <div className="p-3 rounded-md bg-destructive/15 text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-4" />
              <span>{errors.auth}</span>
            </div>
          )}
          
          <FormInput
            id="identifier"
            label="Username or Email"
            type="text"
            value={identifier}
            onChange={handleIdentifierChange}
            placeholder="johndoe or name@company.com"
            error={errors.identifier}
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
