import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { SUPPORTED_LANGUAGES, Language, mockTranslate } from "@/constants/peepData";

interface PeepLanguageContextValue {
  selectedLang: Language;
  setLanguage: (lang: Language) => void;
  translateText: (text: string, sourceLang?: string) => string;
  isTranslating: boolean;
  allLanguages: Language[];
}

const PeepLanguageContext = createContext<PeepLanguageContextValue | null>(null);

export function PeepLanguageProvider({ children }: { children: ReactNode }) {
  const [selectedLang, setSelectedLang] = useState<Language>(SUPPORTED_LANGUAGES[0]);
  const [isTranslating, setIsTranslating] = useState(false);

  const setLanguage = useCallback((lang: Language) => {
    if (lang.code === selectedLang.code) return;
    setIsTranslating(true);
    setTimeout(() => {
      setSelectedLang(lang);
      setIsTranslating(false);
    }, 400);
  }, [selectedLang.code]);

  const translateText = useCallback(
    (text: string, sourceLang = "en"): string => {
      if (selectedLang.code === sourceLang) return text;
      return mockTranslate(text, selectedLang.code);
    },
    [selectedLang]
  );

  return (
    <PeepLanguageContext.Provider
      value={{
        selectedLang,
        setLanguage,
        translateText,
        isTranslating,
        allLanguages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </PeepLanguageContext.Provider>
  );
}

export function usePeepLanguage() {
  const ctx = useContext(PeepLanguageContext);
  if (!ctx) throw new Error("usePeepLanguage must be inside PeepLanguageProvider");
  return ctx;
}
