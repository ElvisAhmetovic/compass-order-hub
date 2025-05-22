
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/context/SupabaseAuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useSupabaseAuth();

  useEffect(() => {
    if (!isLoading) {
      console.log("Index: User authentication status:", user ? "Authenticated" : "Not authenticated");
      
      // If no user is found after loading completes, redirect to auth
      if (user) {
        navigate("/dashboard");
      } else {
        // Force replace to prevent back navigation to this page after logout
        console.log("Index: No authenticated user, redirecting to auth page");
        
        // Use setTimeout to ensure navigation happens after all state updates
        setTimeout(() => {
          navigate("/auth", { replace: true });
        }, 0);
      }
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Order Flow Compass</h1>
        <p className="text-xl text-gray-600 mb-4">Loading your application...</p>
      </div>
    </div>
  );
};

export default Index;
