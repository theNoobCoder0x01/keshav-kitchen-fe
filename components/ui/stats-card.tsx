"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label?: string;
  value: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({
  label,
  value,
  icon: Icon,
  iconColor = "#00cfe8",
  trend,
  className,
}: StatsCardProps) {
  return (
    <Card
      className={cn(
        "bg-white/80 backdrop-blur-sm border-[#dbdade]/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1",
        className,
      )}
    >
      <CardContent className="p-3 sm:p-4 lg:p-6">
        <div className="flex flex-col space-y-3">
          {/* Icon and Value */}
          <div className="flex items-center justify-between">
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${iconColor}15, ${iconColor}25)`,
                border: `1px solid ${iconColor}20`,
              }}
            >
              <Icon
                className="w-5 h-5 sm:w-6 sm:h-6"
                style={{ color: iconColor }}
              />
            </div>
            <div className="text-right">
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#4b465c] leading-none">
                {value}
              </p>
            </div>
          </div>

          {/* Label and Trend */}
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-[#4b465c]/70 font-medium leading-tight">
              {label ?? "-"}
            </p>
            {trend && (
              <div
                className={cn(
                  "flex items-center space-x-1 text-xs font-medium",
                  trend.isPositive ? "text-green-600" : "text-red-500",
                )}
              >
                <span className="text-sm">
                  {trend.isPositive ? "↗" : "↘"}
                </span>
                <span>{Math.abs(trend.value)}%</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
