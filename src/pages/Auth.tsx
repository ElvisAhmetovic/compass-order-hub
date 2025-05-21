
import { useState, useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/context/SupabaseAuthContext";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import AuthLayout from "@/components/auth/AuthLayout";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const { user, isLoading } = useSupabaseAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Auth component rendered, user:", user, "isLoading:", isLoading);
    
    // Check if we have a user but we're not loading
    if (user && !isLoading) {
      console.log("User is authenticated, redirecting to dashboard");
      const from = (location.state as { from?: string })?.from || "/dashboard";
      navigate(from);
    }
  }, [user, isLoading, location.state, navigate]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // Redirect handled in useEffect to avoid React state updates during render

  const handleRegistrationSuccess = () => {
    toast({
      title: "Account Created",
      description: "Please sign in with your new credentials.",
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
