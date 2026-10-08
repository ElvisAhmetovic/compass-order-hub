
import RegisterForm from "@/components/auth/RegisterForm";
import abTeamSymbol from "@/assets/ab-team-symbol.png";

const Register = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <div className="mb-6">
        <div className="flex justify-center mb-4">
          <img
            src={abTeamSymbol}
            alt="Empria Tech"
            className="h-16 w-16 object-contain"
          />
        </div>
        <h1 className="text-center font-heading text-3xl font-bold text-primary">Empria Tech CRM</h1>
        <p className="text-center text-muted-foreground">Create a new account</p>
      </div>
      <RegisterForm />
    </div>
  );
};

export default Register;
