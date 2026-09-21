
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
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <h1 className="mb-4 font-heading text-4xl font-bold text-primary">AB Media Team CRM</h1>
          <p className="mb-4 text-xl text-muted-foreground">Loading your application...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  return null;
};

export default Index;
