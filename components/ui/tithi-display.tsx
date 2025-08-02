"use client";

import { useTithi } from "@/hooks/use-tithi";
import { cn } from "@/lib/utils";
import { Calendar, Loader2 } from "lucide-react";

interface TithiDisplayProps {
  date?: Date;
  kitchenId?: string;
  className?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

export function TithiDisplay({
  date,
  kitchenId,
  className,
  showIcon = false,
  size = "md",
}: TithiDisplayProps) {
  const { tithi, eventSummary, isLoading, error } = useTithi(date, kitchenId);

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2 text-gray-500", className)}>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading tithi...</span>
      </div>
    );
  }

  if (error || (!tithi && !eventSummary)) {
    return (
      <div className={cn("text-gray-400 text-sm", className)}>
        {showIcon && <Calendar className="w-4 h-4 inline mr-1" />}
        No tithi information
      </div>
    );
  }

  const displayText = tithi || eventSummary || "Unknown";

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div
      className={cn(
        "text-[#4b465c]/70 font-medium flex items-center gap-1",
        sizeClasses[size],
        className,
      )}
    >
      {showIcon && <Calendar className="w-4 h-4 text-[#674af5]" />}
      <span>{displayText}</span>
    </div>
  );
}

export function TodayTithi({
  kitchenId,
  className,
  showIcon = true,
  size = "md",
}: Omit<TithiDisplayProps, "date">) {
  return (
    <TithiDisplay
      date={new Date()}
      kitchenId={kitchenId}
      className={className}
      showIcon={showIcon}
      size={size}
    />
  );
}