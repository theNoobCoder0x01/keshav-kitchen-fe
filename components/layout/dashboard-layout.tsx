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
    <div className="min-h-screen gradient-bg">
      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        <Sidebar
          activeItem={activeMenuItem}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 lg:ml-0">
          <div className="container-modern section-modern">
            <div className="animate-fade-in">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}