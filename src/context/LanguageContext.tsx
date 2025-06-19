
import React, { createContext, useContext, useState, useEffect } from 'react';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Return a fallback instead of throwing an error
    console.warn('useLanguage must be used within a LanguageProvider. Using fallback values.');
    return {
      language: 'en',
      setLanguage: () => {},
      t: (key: string) => key // Return the key itself as fallback
    };
  }
  return context;
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    // Load language from localStorage or default to English
    return localStorage.getItem('ui-language') || 'en';
  });

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('ui-language', lang);
  };

  const t = (key: string): string => {
    try {
      // Import translations dynamically to avoid circular imports
      const { getUITranslation } = require('../utils/translations');
      return getUITranslation(language, key);
    } catch (error) {
      console.warn('Failed to load translations:', error);
      return key; // Return the key itself as fallback
    }
  };

  const value = {
    language,
    setLanguage,
    t
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
