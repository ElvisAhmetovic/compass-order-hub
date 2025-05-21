
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LoginForm from '@/components/auth/LoginForm';

const Login = () => {
  const navigate = useNavigate();
  
  // Redirect to Register page when toggle is clicked
  const handleToggleForm = () => {
    navigate('/register');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-center text-primary">Order Flow Compass</h1>
        <p className="text-center text-muted-foreground">Sign in to continue</p>
      </div>
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <LoginForm onToggleForm={handleToggleForm} />
      </div>
    </div>
  );
};

export default Login;
