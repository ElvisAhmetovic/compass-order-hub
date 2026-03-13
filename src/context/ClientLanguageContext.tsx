import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ClientLanguage, getTranslation } from '@/i18n/clientTranslations';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface ClientLanguageContextType {
  language: ClientLanguage;
  setLanguage: (lang: ClientLanguage) => Promise<void>;
  t: (key: string, params?: Record<string, string>) => string;
}

const ClientLanguageContext = createContext<ClientLanguageContextType | undefined>(undefined);

export const ClientLanguageProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<ClientLanguage>('en');

  // Load preferred language from profile on mount
  useEffect(() => {
    if (!user?.id) return;

    const loadLanguage = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('preferred_language')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && data?.preferred_language) {
        const lang = data.preferred_language as ClientLanguage;
        if (['en', 'de', 'nl', 'fr', 'sv'].includes(lang)) {
          setLanguageState(lang);
        }
      }
    };

    loadLanguage();
  }, [user?.id]);

  const setLanguage = useCallback(async (lang: ClientLanguage) => {
    setLanguageState(lang);
    
    if (user?.id) {
      await supabase
        .from('profiles')
        .update({ preferred_language: lang })
        .eq('id', user.id);
    }
  }, [user?.id]);

  const t = useCallback((key: string, params?: Record<string, string>) => {
    return getTranslation(language, key, params);
  }, [language]);

  return (
    <ClientLanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </ClientLanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(ClientLanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a ClientLanguageProvider');
  }
  return context;
};
