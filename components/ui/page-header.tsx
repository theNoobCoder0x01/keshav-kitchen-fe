"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4",
        className,
      )}
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-primary to-primary/80 bg-clip-text text-transparent">
          {title}
        </h1>
        {subtitle && (
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
