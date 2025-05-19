
import LoginForm from "@/components/auth/LoginForm";

const Login = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-center text-primary">Order Flow Compass</h1>
        <p className="text-center text-muted-foreground">Sign in to your account</p>
      </div>
      <LoginForm />
    </div>
  );
};

export default Login;
