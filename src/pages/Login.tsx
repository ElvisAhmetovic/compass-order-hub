
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import LoginForm from '@/components/auth/LoginForm';
import { Loader2 } from 'lucide-react';
import mediaMarketingSymbol from '@/assets/media-marketing-symbol.png.asset.json';
const abTeamSymbol = mediaMarketingSymbol.url;

const Login = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === 'client') {
        navigate('/client/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <div className="mb-6 text-center">
        <div className="flex flex-col items-center gap-4 mb-4">
          <img
            src={abTeamSymbol}
            alt="Media Marketing LTD"
            className="h-16 w-16 object-contain"
          />
          <div>
            <h1 className="font-heading text-3xl font-bold text-primary">Media Marketing LTD - CRM</h1>
            <p className="text-muted-foreground">Sign in to continue</p>
          </div>
        </div>
      </div>
      <LoginForm />
    </div>
  );
};

export default Login;
