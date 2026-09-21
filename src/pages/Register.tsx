
import RegisterForm from "@/components/auth/RegisterForm";

const Register = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <div className="mb-6">
        <h1 className="text-center font-heading text-3xl font-bold text-primary">AB Media Team CRM</h1>
        <p className="text-center text-muted-foreground">Create a new account</p>
      </div>
      <RegisterForm />
    </div>
  );
};

export default Register;
