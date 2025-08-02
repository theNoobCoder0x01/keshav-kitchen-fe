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
  iconColor = "hsl(var(--primary))",
  trend,
  className,
}: StatsCardProps) {
  return (
    <Card
      className={cn(
        "glass border-0 shadow-modern hover:shadow-modern-lg transition-all duration-300 hover:-translate-y-1 card-hover",
        className,
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="body-small text-muted-foreground font-medium">
              {label}
            </p>
            <p className="text-3xl font-bold tracking-tight">
              {value}
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
                <span className="text-muted-foreground">vs last week</span>
              </div>
            )}
          </div>
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${iconColor}15, ${iconColor}25)`,
              border: `1px solid ${iconColor}20`,
            }}
          >
            <Icon
              className="w-6 h-6"
              style={{ color: iconColor }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}