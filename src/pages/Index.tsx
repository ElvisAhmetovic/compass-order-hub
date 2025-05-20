
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // For now, just redirect to login page
    // In a real app with Supabase integration, we would check authentication status
    navigate("/login");
  }, [navigate]);

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
