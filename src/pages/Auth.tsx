
import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
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

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // Redirect if user is already logged in
  if (user) {
    // Redirect to the page they were trying to access or dashboard
    const from = (location.state as { from?: string })?.from || "/dashboard";
    return <Navigate to={from} />;
  }

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
};
