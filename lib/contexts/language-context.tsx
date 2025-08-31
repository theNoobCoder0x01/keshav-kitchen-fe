"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { IntlProvider } from "react-intl";

// Import translation files
import enMessages from "@/locales/en/common.json";
import guMessages from "@/locales/gu/common.json";
import api from "../api/axios";

export type Language = "en" | "gu";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  messages: Record<string, string>;
  updateUserLanguage: (lang: Language) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

// Utility function to flatten nested JSON objects for react-intl
function flattenMessages(obj: any, prefix = ""): Record<string, string> {
  const flattened: Record<string, string> = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (
        typeof obj[key] === "object" &&
        obj[key] !== null &&
        !Array.isArray(obj[key])
      ) {
        // Recursively flatten nested objects
        Object.assign(flattened, flattenMessages(obj[key], newKey));
      } else {
        // Add the flattened key-value pair
        flattened[newKey] = obj[key];
      }
    }
  }

  return flattened;
}

// Flatten the nested translation objects
const messages = {
  en: flattenMessages(enMessages),
  gu: flattenMessages(guMessages),
};

interface LanguageProviderProps {
  children: ReactNode;
  initialLanguage?: Language;
}

export function LanguageProvider({
  children,
  initialLanguage = "en",
}: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(initialLanguage);

  // Load language preference from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language;
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "gu")) {
      setLanguageState(savedLanguage);
    }
  }, []);

  // Save language preference to localStorage
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  // Update user language preference in database
  const updateUserLanguage = async (lang: Language) => {
    try {
      const response = await api.patch("/user/language", {
        language: lang,
      });

      if (!response.status.toString().startsWith("2")) {
        throw new Error("Failed to update language preference");
      }

      setLanguage(lang);
    } catch (error) {
      console.error("Error updating language preference:", error);
      throw error;
    }
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    messages: messages[language],
    updateUserLanguage,
  };

  return (
    <LanguageContext.Provider value={value}>
      <IntlProvider
        locale={language}
        messages={messages[language]}
        defaultLocale="en"
      >
        {children}
      </IntlProvider>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

// Export language options for use in components
export const LANGUAGE_OPTIONS = [
  { value: "en", label: "English", nativeLabel: "English" },
  { value: "gu", label: "Gujarati", nativeLabel: "ગુજરાતી" },
] as const;
