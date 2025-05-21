
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from "@/context/SupabaseAuthContext";
import { authenticate } from "@/services/authService";

interface LoginFormProps {
  redirectPath: string;
}

export function LoginForm({ redirectPath }: LoginFormProps) {
  const { signIn } = useSupabaseAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    
    if (!email || !password) {
      setError("Please fill in all required fields");
      setSubmitting(false);
      return;
    }
    
    try {
      console.log("Login attempt with:", { email });
      
      // Try to authenticate with both systems
      // First try Supabase
      const result = await signIn(email, password);
      
      if (!result.success) {
        console.error("Supabase login error:", result.error);
        
        // If Supabase login fails, try legacy authentication
        const legacyResult = await authenticate(email, password);
        
        if (legacyResult.success) {
          console.log("Legacy login successful!");
          toast({
            title: "Login successful",
            description: "Welcome back!"
          });
          navigate(redirectPath);
          return;
        }
        
        // If both fail, show error
        setError(result.error || "Login failed. Please check your credentials.");
      } else {
        console.log("Supabase login successful!");
        toast({
          title: "Login successful",
          description: "Welcome back!"
        });
        navigate(redirectPath);
      }
    } catch (error) {
      console.error("Unexpected error during login:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 text-sm border rounded-md border-destructive/50 bg-destructive/10 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
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
          disabled={submitting}
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <a href="#" className="text-xs text-primary hover:underline">
            Forgot password?
          </a>
        </div>
        <Input 
          id="password" 
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={submitting}
        />
      </div>
      
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : "Sign In"}
      </Button>
    </form>
  );
}
