"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Clock,
  Minus,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Users,
  Utensils,
} from "lucide-react";
import { Skeleton } from "./skeleton";

interface EnhancedStatData {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  color?: "primary" | "success" | "warning" | "info";
}

interface EnhancedStatsGridProps {
  stats: EnhancedStatData[];
  className?: string;
}

export function EnhancedStatsGrid({
  stats,
  className,
}: EnhancedStatsGridProps) {
  const getColorClasses = (color?: string) => {
    switch (color) {
      case "success":
        return {
          icon: "text-green-600 dark:text-green-400",
          bg: "bg-green-50 dark:bg-green-950",
          border: "border-green-200 dark:border-green-800",
        };
      case "warning":
        return {
          icon: "text-orange-600 dark:text-orange-400",
          bg: "bg-orange-50 dark:bg-orange-950",
          border: "border-orange-200 dark:border-orange-800",
        };
      case "info":
        return {
          icon: "text-blue-600 dark:text-blue-400",
          bg: "bg-blue-50 dark:bg-blue-950",
          border: "border-blue-200 dark:border-blue-800",
        };
      default:
        return {
          icon: "text-primary",
          bg: "bg-primary/5",
          border: "border-primary/20",
        };
    }
  };

  const getTrendIcon = (trend?: { value: number; isPositive: boolean }) => {
    if (!trend) return <Minus className="w-3 h-3 text-muted-foreground" />;
    return trend.isPositive ? (
      <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />
    ) : (
      <TrendingDown className="w-3 h-3 text-red-600 dark:text-red-400" />
    );
  };

  return (
    <div
      className={cn(
        "grid grid-cols-12 gap-2 md:gap-4",
        className,
      )}
    >
      {stats.map((stat, index) => {
        const colors = getColorClasses(stat.color);

        return (
          <Card
            key={index}
            className={cn(
              "bg-card/80 backdrop-blur-xs border-border/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1",
              "col-span-12 sm:col-span-6 md:col-span-3",
              colors.border,
            )}
          >
            <CardContent className="p-3 md:p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                    colors.bg,
                  )}
                >
                  <stat.icon className={cn("w-5 h-5", colors.icon)} />
                </div>
                <p className="text-xl md:text-2xl font-bold text-foreground leading-tight">
                  {stat.value}
                </p>
                {stat.trend && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs px-2 py-1 flex items-center gap-1 ml-1",
                      stat.trend.isPositive
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
                    )}
                  >
                    {getTrendIcon(stat.trend)}
                    <span>{Math.abs(stat.trend.value)}%</span>
                  </Badge>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground leading-tight">
                  {stat.label}
                </p>
                {stat.subtitle && (
                  <p className="text-xs text-muted-foreground leading-tight">
                    {stat.subtitle}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Skeleton loader for EnhancedStatsGrid
export function EnhancedStatsGridSkeleton({ cardCount = 4, className = "" }: { cardCount?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-12 gap-2 md:gap-4", className)}>
      {Array.from({ length: cardCount }).map((_, idx) => (
        <Card key={idx} className={cn("bg-card/80 backdrop-blur-xs border-border/50 col-span-12 sm:col-span-6 md:col-span-3")}> 
          <CardContent className="p-3 md:p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <Skeleton className="h-6 w-16 md:w-20 rounded" />
              <Skeleton className="h-6 w-10 rounded ml-1" />
            </div>
            <div>
              <Skeleton className="h-4 w-20 mb-1 rounded" />
              <Skeleton className="h-3 w-16 rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Predefined stat configurations for common use cases
export const createMenuStats = (data: any) => {
  const totalMeals =
    data?.byMealType?.BREAKFAST +
      data?.byMealType?.LUNCH +
      data?.byMealType?.DINNER +
      data?.byMealType?.SNACK || 0;

  return [
    {
      label: "Total Meals",
      value: totalMeals,
      icon: Utensils,
      subtitle: "Planned for today",
      color: "primary" as const,
    },
    {
      label: "Breakfast",
      value: data?.byMealType?.BREAKFAST || 0,
      icon: Clock,
      subtitle: "Morning meals",
      color: "info" as const,
    },
    {
      label: "Lunch",
      value: data?.byMealType?.LUNCH || 0,
      icon: Users,
      subtitle: "Midday meals",
      color: "success" as const,
    },
    {
      label: "Dinner",
      value: data?.byMealType?.DINNER || 0,
      icon: ShoppingCart,
      subtitle: "Evening meals",
      color: "warning" as const,
    },
  ];
};
