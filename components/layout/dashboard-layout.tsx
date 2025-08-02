"use client";

import type React from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeMenuItem?: string;
  className?: string;
  fluid?: boolean;
}

export function DashboardLayout({
  children,
  activeMenuItem,
  className,
  fluid = false,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting for proper SSR
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [activeMenuItem]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarOpen && !(event.target as Element).closest('.sidebar-container')) {
        setSidebarOpen(false);
      }
    };

    if (sidebarOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [sidebarOpen]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background animate-pulse">
        <div className="h-16 border-b border-border" />
        <div className="flex">
          <div className="hidden lg:block w-64 border-r border-border" />
          <div className="flex-1 p-8">
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded-lg w-1/3" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="grid grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-32 bg-muted rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* Header */}
      <Header 
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)} 
        sidebarOpen={sidebarOpen}
      />
      
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      
      {/* Layout container */}
      <div className="flex relative">
        {/* Sidebar */}
        <div className="sidebar-container">
          <Sidebar
            activeItem={activeMenuItem}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
        
        {/* Main content */}
        <main className={cn(
          "flex-1 transition-all duration-300 min-h-[calc(100vh-4rem)]",
          "lg:ml-0", // Sidebar handles its own positioning
          sidebarOpen ? "lg:pl-0" : "lg:pl-0" // Let sidebar handle spacing
        )}>
          <div className={cn(
            "animate-fade-in",
            fluid ? "p-4 sm:p-6 lg:p-8" : "container-modern section-modern"
          )}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

// Enhanced layout variants
export function CenteredLayout({
  children,
  maxWidth = "4xl",
  className,
}: {
  children: React.ReactNode;
  maxWidth?: "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl";
  className?: string;
}) {
  return (
    <div className={cn("min-h-screen bg-background flex items-center justify-center p-4", className)}>
      <div className={cn(
        "w-full animate-fade-in",
        {
          "max-w-xl": maxWidth === "xl",
          "max-w-2xl": maxWidth === "2xl", 
          "max-w-3xl": maxWidth === "3xl",
          "max-w-4xl": maxWidth === "4xl",
          "max-w-5xl": maxWidth === "5xl",
          "max-w-6xl": maxWidth === "6xl",
          "max-w-7xl": maxWidth === "7xl",
        }
      )}>
        {children}
      </div>
    </div>
  );
}

export function SplitLayout({
  left,
  right,
  className,
  leftClassName,
  rightClassName,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  className?: string;
  leftClassName?: string;
  rightClassName?: string;
}) {
  return (
    <div className={cn("min-h-screen bg-background flex", className)}>
      <div className={cn("flex-1 p-8 lg:p-12", leftClassName)}>
        <div className="animate-slide-in">
          {left}
        </div>
      </div>
      <div className={cn("flex-1 p-8 lg:p-12 bg-muted/30", rightClassName)}>
        <div className="animate-slide-in" style={{ animationDelay: "0.2s" }}>
          {right}
        </div>
      </div>
    </div>
  );
}