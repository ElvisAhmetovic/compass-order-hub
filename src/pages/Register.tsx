
import { RegisterForm } from "@/components/auth/RegisterForm";

const Register = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-center text-primary">Order Flow Compass</h1>
        <p className="text-center text-muted-foreground">Create a new account</p>
      </div>
      <RegisterForm onSuccess={() => {}} />
    </div>
  );
};

export default Register;
