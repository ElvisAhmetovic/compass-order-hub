
import RegisterForm from "@/components/auth/RegisterForm";
import mediaMarketingSymbol from '@/assets/media-marketing-symbol.png.asset.json';
const abTeamSymbol = mediaMarketingSymbol.url;

const Register = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <div className="mb-6">
        <div className="flex justify-center mb-4">
          <img
            src={abTeamSymbol}
            alt="Media Marketing LTD"
            className="h-16 w-16 object-contain"
          />
        </div>
        <h1 className="text-center font-heading text-3xl font-bold text-primary">Media Marketing LTD - CRM</h1>
        <p className="text-center text-muted-foreground">Create a new account</p>
      </div>
      <RegisterForm />
    </div>
  );
};

export default Register;
