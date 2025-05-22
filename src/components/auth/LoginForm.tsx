
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2 } from "lucide-react";
import { useSupabaseAuth } from "@/context/SupabaseAuthContext";
import { useToast } from "@/hooks/use-toast";

interface LoginFormProps {
  redirectPath?: string;
}

export function LoginForm({ redirectPath = "/dashboard" }: LoginFormProps) {
  const { signIn } = useSupabaseAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
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
    
    // Add debug logs to track exactly what's being sent
    console.log("Login attempt with:", { 
      email: email.trim(), // Trim to remove any accidental spaces
      passwordLength: password.length 
    });

    try {
      // Special admin login logging
      if (email === "luciferbebistar@gmail.com") {
        console.log("Admin login attempt detected in LoginForm");
      }
      
      // Make sure the values are properly typed and not null
      const emailToSend = email.trim();
      const passwordToSend = password;
      
      console.log("About to call signIn with:", { 
        emailProvided: !!emailToSend, 
        passwordProvided: !!passwordToSend 
      });
      
      const result = await signIn(emailToSend, passwordToSend);
      
      console.log("Login result:", result);
      
      if (!result.success) {
        setError(result.error || "Invalid email or password");
        // Show toast for login errors to improve visibility
        toast({
          variant: "destructive",
          title: "Login failed",
          description: result.error || "Invalid email or password"
        });
      } else {
        // Show success toast
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        // Redirect on successful login
        console.log("Login successful, redirecting to:", redirectPath);
        navigate(redirectPath);
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An unexpected error occurred. Please try again.");
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred during login"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4" aria-label="Login form">
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm border rounded-md border-destructive/50 bg-destructive/10 text-destructive" role="alert">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          required
          disabled={isLoading}
          aria-required="true"
          aria-invalid={!!error}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
          aria-required="true"
          aria-invalid={!!error}
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading}
        aria-label={isLoading ? "Signing in..." : "Sign In"}
      >
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
