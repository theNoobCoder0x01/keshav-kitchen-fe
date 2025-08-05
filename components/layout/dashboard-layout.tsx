"use client";

import type React from "react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeMenuItem?: string;
}

export function DashboardLayout({
  children,
  activeMenuItem,
}: DashboardLayoutProps) {
  return (
    <div className="w-full">
      {children}
    </div>
  );
}
