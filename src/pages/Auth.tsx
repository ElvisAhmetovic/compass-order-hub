
import { useState, useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/context/SupabaseAuthContext";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import AuthLayout from "@/components/auth/AuthLayout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Auth() {
  const { user, isLoading } = useSupabaseAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Debug auth parameters
  useEffect(() => {
    // Parse URL for token
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const queryParams = new URLSearchParams(window.location.search);
    
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const type = hashParams.get('type');
    const error = queryParams.get('error');
    const errorDescription = queryParams.get('error_description');
    
    console.log("Auth page URL parameters:", { 
      accessToken: accessToken ? "present" : "not present", 
      refreshToken: refreshToken ? "present" : "not present",
      type,
      error,
      errorDescription
    });
    
    // Handle callback from email verification
    if (accessToken && refreshToken && type === 'recovery') {
      // Handle password reset
      toast({
        title: "Password Reset",
        description: "Please set your new password.",
      });
    } else if (error) {
      // Handle errors
      toast({
        title: "Authentication Error",
        description: errorDescription || "There was a problem with authentication.",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Debug authentication state
  useEffect(() => {
    console.log("Auth component rendered, user:", user, "isLoading:", isLoading);
    
    // Check if we have a user but we're not loading
    if (user && !isLoading) {
      console.log("User is authenticated, redirecting to dashboard");
      const from = (location.state as { from?: string })?.from || "/dashboard";
      navigate(from, { replace: true });
    }
    
    // Check Supabase session directly
    supabase.auth.getSession().then(({ data }) => {
      console.log("Direct Supabase session check:", data.session ? "Session exists" : "No session");
    });
  }, [user, isLoading, location.state, navigate]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // If user is already authenticated, redirect to dashboard
  if (user && !isLoading) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleRegistrationSuccess = () => {
    toast({
      title: "Account Created",
      description: "Please check your email for verification instructions, then sign in with your new credentials.",
    });
    setActiveTab("login");
  };

  const handleToggleForm = () => {
    setActiveTab(activeTab === "login" ? "register" : "login");
  };

  return (
    <AuthLayout title={activeTab === "login" ? "Sign In" : "Create Account"}>
      {activeTab === "login" ? (
        <LoginForm onToggleForm={handleToggleForm} />
      ) : (
        <RegisterForm 
          onToggleForm={handleToggleForm}
          onSuccess={handleRegistrationSuccess}
        />
      )}
    </AuthLayout>
  );
}
