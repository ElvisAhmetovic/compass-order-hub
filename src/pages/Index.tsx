
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // User is authenticated, redirect to dashboard
        navigate("/dashboard");
      } else {
        // User is not authenticated, redirect to login
        navigate("/login");
      }
    }
  }, [navigate, user, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Order Flow Compass</h1>
          <p className="text-xl text-gray-600 mb-4">Loading your application...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default Index;
