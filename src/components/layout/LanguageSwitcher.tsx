
import React from 'react';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/context/LanguageContext';
import { SUPPORTED_UI_LANGUAGES } from '@/utils/translations';

const LanguageSwitcher = () => {
  const { language, setLanguage, t } = useLanguage();

  const currentLanguage = SUPPORTED_UI_LANGUAGES.find(lang => lang.code === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <Globe size={16} />
          <span className="hidden sm:inline">{currentLanguage?.name || 'English'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white border shadow-lg z-50">
        {SUPPORTED_UI_LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`cursor-pointer hover:bg-gray-100 ${
              language === lang.code ? 'bg-blue-50 text-blue-700' : ''
            }`}
          >
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
