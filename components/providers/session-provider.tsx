"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

interface SessionProviderWrapperProps {
  children: ReactNode;
}

export function SessionProviderWrapper({
  children,
}: SessionProviderWrapperProps) {
  return (
    <SessionProvider
      basePath={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/api/auth`}
    >
      {children}
    </SessionProvider>
  );
}
