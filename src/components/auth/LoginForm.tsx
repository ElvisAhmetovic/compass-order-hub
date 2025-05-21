
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSupabaseAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/integrations/supabase/client";

interface LoginFormProps {
  onToggleForm?: () => void;
}

export default function LoginForm({ onToggleForm }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { signIn, isLoading } = useSupabaseAuth();

  // Clear error when inputs change
  useEffect(() => {
    if (error) setError("");
  }, [email, password]);

  // Check Supabase configuration
  useEffect(() => {
    console.log("Checking Supabase configuration...");
    supabase.auth.getSession().then(({ data }) => {
      console.log("Supabase session check from LoginForm:", data.session ? "Session exists" : "No session");
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validate inputs before submitting
    if (!email || !password) {
      setError("Please fill in all required fields");
      return;
    }
    
    try {
      console.log(`Attempting to log in with: ${email}`);
      
      // Ensure email and password are properly passed to signIn
      const result = await signIn(email, password);
      console.log("Sign in result:", result);
      
      if (!result.success) {
        setError(result.error || "Login failed. Please check your credentials.");
        return;
      }
      
      // Navigation is handled by Auth.tsx component through redirection
    } catch (error: any) {
      console.error("Login error:", error);
      setError(error?.message || "An unexpected error occurred during login.");
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email" 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          required
          disabled={isLoading}
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <a href="#" className="text-xs text-primary hover:underline">
            Forgot password?
          </a>
        </div>
        <div className="relative">
          <Input 
            id="password" 
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
          <button 
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Signing in..." : "Sign In"}
      </Button>
      
      {onToggleForm && (
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <button 
              type="button" 
              onClick={onToggleForm}
              className="text-primary hover:underline"
            >
              Register
            </button>
          </p>
        </div>
      )}
    </form>
  );
}
