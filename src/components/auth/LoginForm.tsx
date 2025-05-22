
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2 } from "lucide-react";
import { useSupabaseAuth } from "@/context/SupabaseAuthContext";

interface LoginFormProps {
  redirectPath?: string;
}

export function LoginForm({ redirectPath = "/dashboard" }: LoginFormProps) {
  const { signIn } = useSupabaseAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!email || !password) {
      setError("Please enter both email and password");
      setIsLoading(false);
      return;
    }

    try {
      // Added more debug logs to track the login flow
      console.log("Starting login process with email:", email);
      
      // Special admin login logging
      if (email === "luciferbebistar@gmail.com") {
        console.log("Admin login attempt detected in LoginForm");
      }
      
      const result = await signIn(email, password);
      
      console.log("Login result:", result);
      
      if (!result.success) {
        setError(result.error || "Invalid email or password");
      } else {
        // Redirect on successful login
        console.log("Login successful, redirecting to:", redirectPath);
        navigate(redirectPath);
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm border rounded-md border-destructive/50 bg-destructive/10 text-destructive">
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
          disabled={isLoading}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : "Sign In"}
      </Button>
      
      {email === "luciferbebistar@gmail.com" && (
        <div className="mt-2 text-sm text-muted-foreground">
          <p>Admin access: use password "Admin@123"</p>
        </div>
      )}
    </form>
  );
}
