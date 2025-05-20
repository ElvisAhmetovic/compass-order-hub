
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/context/AuthContext";
import { assignAdminPermission } from "@/utils/adminPermissionHelper";

const Login = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Check if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  
  // Ensure admin user exists
  useEffect(() => {
    assignAdminPermission("luciferbebistar@gmail.com");
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-col gap-6 mx-auto max-w-md w-full p-4 sm:p-8">
        <div className="flex flex-col space-y-2 text-center mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">Login</h1>
          <p className="text-sm text-muted-foreground">
            Enter your credentials to access your account
          </p>
        </div>
        
        <LoginForm />
        
        <p className="px-8 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="underline underline-offset-4 hover:text-primary"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
