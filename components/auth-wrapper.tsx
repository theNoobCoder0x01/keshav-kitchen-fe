"use client";

import type React from "react";

import { checkAuthStatus } from "@/lib/api/auth-check";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useState } from "react";

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">(
    "loading"
  );
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const authStatus = await checkAuthStatus();

        if (!isMounted) return;

        if (authStatus.authenticated) {
          setStatus("authenticated");
          return;
        }

        setStatus("unauthenticated");
        router.replace("/auth/signin");
      } catch {
        if (!isMounted) return;
        setStatus("unauthenticated");
        router.replace("/auth/signin");
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#f8f7fa] via-[#e1dbfd] to-[#674af5]/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#674af5] mx-auto mb-4"></div>
          <p className="text-[#4b465c]/70">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null; // Will redirect
  }

  return <>{children}</>;
}
