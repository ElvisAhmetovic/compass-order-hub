
import React, { useEffect, useState } from 'react';
import { ThemeProvider as NextThemeProvider } from 'next-themes';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);

  // Ensure proper mounting to prevent hydration issues and localStorage conflicts
  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent rendering until mounted to avoid localStorage access issues
  if (!mounted) {
    return <div className="opacity-0">{children}</div>;
  }

  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={true}
      disableTransitionOnChange={false}
      storageKey="theme-preference"
    >
      {children}
    </NextThemeProvider>
  );
}
