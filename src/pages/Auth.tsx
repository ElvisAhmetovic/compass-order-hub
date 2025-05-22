
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/context/SupabaseAuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { AuthContainer } from "@/components/auth/AuthContainer";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { DevAuthNote } from "@/components/auth/DevAuthNote";

export default function Auth() {
  const { user, isLoading } = useSupabaseAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const location = useLocation();
  const navigate = useNavigate();

  // Get the intended destination from location state or default to dashboard
  const from = location.state?.from?.pathname || "/dashboard";
  
  // Set initial tab based on URL parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get("tab");
    if (tab === "register") {
      setActiveTab("register");
    }
  }, [location]);

  // Handle successful registration
  const handleRegisterSuccess = () => {
    // Switch to login tab after successful registration
    setActiveTab("login");
  };

  // Redirect if user is already logged in
  useEffect(() => {
    if (user && !isLoading) {
      console.log("User is logged in, redirecting to:", from);
      navigate(from, { replace: true });
    }
  }, [user, isLoading, navigate, from]);

  // Show loading state
  if (isLoading) {
    return (
      <AuthContainer>
        <div className="flex items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      </AuthContainer>
    );
  }

  // Don't show redirect component as it causes flashing
  if (user) {
    return null;
  }

  return (
    <AuthContainer>
      <Card className="w-full max-w-md">
        <AuthHeader activeTab={activeTab} onTabChange={setActiveTab} />
        
        <CardContent>
          {/* Development note with helpful information */}
          <DevAuthNote />
          
          <Tabs value={activeTab} className="mt-2">
            <TabsContent value="login">
              <LoginForm redirectPath={from} />
            </TabsContent>
            
            <TabsContent value="register">
              <RegisterForm onSuccess={handleRegisterSuccess} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </AuthContainer>
  );
}
