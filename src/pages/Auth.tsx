
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/context/SupabaseAuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const { user, signIn, signUp, isLoading } = useSupabaseAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if user is already logged in
  if (user) {
    return <Navigate to="/dashboard" />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Please fill in all required fields");
      return;
    }
    
    const result = await signIn(email, password);
    if (!result.success) {
      setError(result.error || "Login failed. Please check your credentials.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password || !fullName) {
      setError("Please fill in all required fields");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    const result = await signUp(email, password, fullName);
    if (!result.success) {
      setError(result.error || "Registration failed. Please try again.");
    } else {
      toast({
        title: "Account Created",
        description: "Check your email for a confirmation link.",
      });
      setActiveTab("login");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-primary">Order Flow Compass</h1>
        <p className="text-muted-foreground">Manage your orders efficiently</p>
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        
        <CardContent>
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 text-sm border rounded-md border-destructive/50 bg-destructive/10 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
          
          {activeTab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
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
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input 
                  id="fullName" 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="registerEmail">Email</Label>
                <Input 
                  id="registerEmail" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="registerPassword">Password</Label>
                <Input 
                  id="registerPassword" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  Password must be at least 6 characters long
                </p>
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
