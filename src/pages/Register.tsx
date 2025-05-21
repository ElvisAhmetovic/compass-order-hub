
import { useNavigate } from 'react-router-dom';
import RegisterForm from "@/components/auth/RegisterForm";
import { useToast } from "@/hooks/use-toast";

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Redirect to Login page when toggle is clicked
  const handleToggleForm = () => {
    navigate('/auth', { state: { activeTab: 'login' } });
  };
  
  // Handle successful registration
  const handleRegistrationSuccess = () => {
    toast({
      title: "Account Created",
      description: "Please sign in with your new credentials.",
    });
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-center text-primary">Order Flow Compass</h1>
        <p className="text-center text-muted-foreground">Create a new account</p>
      </div>
      <RegisterForm 
        onToggleForm={handleToggleForm}
        onSuccess={handleRegistrationSuccess}
      />
    </div>
  );
};

export default Register;
