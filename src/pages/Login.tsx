
import React from 'react';
import { Link } from 'react-router-dom';
import LoginForm from '@/components/auth/LoginForm';

const Login = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <img 
            src="/lovable-uploads/2d4259f4-7fb1-4221-9e23-4bec4378d055.png" 
            alt="AB Media Team Logo" 
            className="h-12 w-auto"
          />
          <div>
            <h1 className="text-3xl font-bold text-primary">Order Flow Compass</h1>
            <p className="text-muted-foreground">Sign in to continue</p>
          </div>
        </div>
      </div>
      <LoginForm />
      <div className="mt-4 text-sm text-center">
        Don't have an account?{" "}
        <Link to="/register" className="text-blue-600 hover:text-blue-800 hover:underline">
          Register
        </Link>
      </div>
    </div>
  );
};

export default Login;
