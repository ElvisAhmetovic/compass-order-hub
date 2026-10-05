import { useEffect, useState } from "react";
import type { HomepageLanguage } from "@/content/homepage";

export const usePublicLanguage = () => {
  const [language, setLanguage] = useState<HomepageLanguage>(() =>
    window.localStorage.getItem("empria-home-language") === "en" ? "en" : "de",
  );

  useEffect(() => {
    window.localStorage.setItem("empria-home-language", language);
    document.documentElement.lang = language;
  }, [language]);

  return { language, setLanguage };
};