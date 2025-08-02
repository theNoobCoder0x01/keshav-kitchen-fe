"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string | ReactNode;
  subtitle?: string;
  description?: string;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  gradient?: boolean;
  centered?: boolean;
  children?: ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  description,
  actions,
  breadcrumb,
  className,
  size = "md",
  gradient = false,
  centered = false,
  children,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "relative space-y-6 mb-8 sm:mb-12",
        centered && "text-center",
        className,
      )}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl opacity-60" />
      
      {/* Breadcrumb */}
      {breadcrumb && (
        <div className="animate-slide-in">
          {breadcrumb}
        </div>
      )}
      
      {/* Main content */}
      <div
        className={cn(
          "flex flex-col gap-6",
          !centered && "sm:flex-row sm:items-start sm:justify-between",
          centered && "items-center"
        )}
      >
        <div className={cn(
          "space-y-3 flex-1",
          centered && "max-w-3xl"
        )}>
          {/* Title with conditional gradient */}
          <h1 className={cn(
            "font-bold tracking-tight animate-slide-up",
            {
              "text-2xl sm:text-3xl": size === "sm",
              "text-3xl sm:text-4xl lg:text-5xl": size === "md",
              "text-4xl sm:text-5xl lg:text-6xl": size === "lg",
            },
            gradient ? "text-gradient" : "text-foreground"
          )}>
            {title}
          </h1>
          
          {/* Subtitle */}
          {subtitle && (
            <h2 className={cn(
              "font-medium text-muted-foreground animate-slide-up",
              {
                "text-lg": size === "sm",
                "text-xl sm:text-2xl": size === "md", 
                "text-2xl sm:text-3xl": size === "lg",
              }
            )} style={{ animationDelay: "0.1s" }}>
              {subtitle}
            </h2>
          )}
          
          {/* Description */}
          {description && (
            <p className={cn(
              "leading-relaxed text-muted-foreground animate-slide-up",
              {
                "text-sm": size === "sm",
                "text-base sm:text-lg": size === "md",
                "text-lg sm:text-xl": size === "lg",
              },
              centered ? "max-w-2xl mx-auto" : "max-w-3xl"
            )} style={{ animationDelay: "0.2s" }}>
              {description}
            </p>
          )}
        </div>
        
        {/* Actions */}
        {actions && (
          <div className={cn(
            "flex flex-wrap gap-3 animate-slide-up",
            centered ? "justify-center" : "sm:flex-shrink-0"
          )} style={{ animationDelay: "0.3s" }}>
            {actions}
          </div>
        )}
      </div>

      {/* Children for additional content */}
      {children}
    </div>
  );
}

// Specialized page header variants
export function WelcomeHeader({
  name,
  message,
  actions,
  className,
}: {
  name: string;
  message?: string;
  actions?: ReactNode;
  className?: string;
}) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <PageHeader
      title={`${getGreeting()}, ${name}!`}
      subtitle={message || "Welcome back to your dashboard"}
      gradient={true}
      size="lg"
      actions={actions}
      className={className}
    />
  );
}

export function FeatureHeader({
  title,
  description,
  status,
  actions,
  className,
}: {
  title: string;
  description: string;
  status?: "beta" | "new" | "updated";
  actions?: ReactNode;
  className?: string;
}) {
  const titleWithStatus = (
    <div className="flex items-center gap-3">
      {title}
      {status && (
        <span className={cn(
          "px-2 py-1 rounded-full text-xs font-medium uppercase tracking-wider",
          {
            "bg-primary/10 text-primary": status === "new",
            "bg-yellow-100 text-yellow-700": status === "beta",
            "bg-success/10 text-success": status === "updated",
          }
        )}>
          {status}
        </span>
      )}
    </div>
  );

  return (
    <div className={cn("relative", className)}>
      <PageHeader
        title={titleWithStatus}
        description={description}
        actions={actions}
        size="md"
      />
    </div>
  );
}