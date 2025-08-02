"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
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
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8",
        className,
      )}
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#674af5] to-[#856ef7] bg-clip-text text-transparent">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[#4b465c]/70 mt-1 text-sm sm:text-base">
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
