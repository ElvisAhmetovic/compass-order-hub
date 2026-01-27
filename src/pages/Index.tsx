
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    console.log('Index page - Loading:', isLoading, 'User:', user?.email, 'Role:', user?.role);
    
    if (!isLoading) {
      if (user) {
        // Role-based redirection
        if (user.role === 'client') {
          console.log('Redirecting client to client dashboard');
          navigate("/client/dashboard");
        } else {
          console.log('Redirecting admin/agent/user to dashboard');
          navigate("/dashboard");
        }
      } else {
        console.log('Redirecting to login');
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  return null;
};

export default Index;
