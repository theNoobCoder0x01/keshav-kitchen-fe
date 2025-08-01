"use client";

import type React from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { useState } from "react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeMenuItem?: string;
}

export function DashboardLayout({
  children,
  activeMenuItem,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f7fa] via-[#fafbfc] to-[#f1f5f9]">
      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        <Sidebar
          activeItem={activeMenuItem}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 lg:ml-0 p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
