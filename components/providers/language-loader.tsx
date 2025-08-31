"use client";

import api from "@/lib/api/axios";
import { useLanguage } from "@/lib/contexts/language-context";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

export function LanguageLoader() {
  const { data: session, status } = useSession();
  const { language, setLanguage } = useLanguage();

  useEffect(() => {
    // Only fetch language preference when user is authenticated
    if (status === "authenticated" && session?.user?.email) {
      fetchUserLanguagePreference();
    }
  }, [status, session?.user?.email]);

  const fetchUserLanguagePreference = async () => {
    try {
      const response = await api.get("/user/language");
      if (response.status.toString().startsWith("2")) {
        const data = await response.data;
        if (
          data.success &&
          data.data.language &&
          data.data.language !== language
        ) {
          setLanguage(data.data.language);
        }
      }
    } catch (error) {
      console.error("Error fetching user language preference:", error);
      // Fallback to localStorage or default language
    }
  };

  return null; // This component doesn't render anything
}
