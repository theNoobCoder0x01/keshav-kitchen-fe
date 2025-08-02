"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, MetricCard } from "./card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatItem {
  id: string;
  title: string;
  value: string | number;
  change?: {
    value: string | number;
    type: "increase" | "decrease" | "neutral";
    period?: string;
  };
  icon?: React.ReactNode;
  color?: "primary" | "success" | "warning" | "error";
  description?: string;
  trend?: {
    data: number[];
    positive: boolean;
  };
}

interface StatsGridProps {
  stats: StatItem[];
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
  variant?: "default" | "compact" | "detailed";
}

export function StatsGrid({ 
  stats, 
  columns = 4, 
  className,
  variant = "default" 
}: StatsGridProps) {
  const gridClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
    6: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
  };

  const getChangeIcon = (type: "increase" | "decrease" | "neutral") => {
    switch (type) {
      case "increase":
        return <TrendingUp className="w-4 h-4" />;
      case "decrease":
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const renderMiniTrend = (trend: { data: number[]; positive: boolean }) => {
    const max = Math.max(...trend.data);
    const min = Math.min(...trend.data);
    const range = max - min || 1;
    
    return (
      <svg
        className="w-16 h-8 opacity-50"
        viewBox="0 0 64 32"
        preserveAspectRatio="none"
      >
        <polyline
          fill="none"
          stroke={trend.positive ? "#10B981" : "#EF4444"}
          strokeWidth="2"
          points={trend.data
            .map((value, index) => {
              const x = (index / (trend.data.length - 1)) * 64;
              const y = 32 - ((value - min) / range) * 32;
              return `${x},${y}`;
            })
            .join(" ")}
        />
      </svg>
    );
  };

  if (variant === "compact") {
    return (
      <div className={cn("grid gap-4", gridClasses[columns], className)}>
        {stats.map((stat) => (
          <Card
            key={stat.id}
            className="p-4 hover:shadow-modern-md transition-all duration-300"
          >
            <div className="flex items-center justify-between space-x-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground truncate">
                  {stat.title}
                </p>
                <p className="text-lg font-bold tracking-tight">
                  {stat.value}
                </p>
              </div>
              {stat.icon && (
                <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10 text-primary">
                  {stat.icon}
                </div>
              )}
            </div>
            {stat.change && (
              <div className="flex items-center gap-1 mt-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-xs font-medium",
                    {
                      "text-success": stat.change.type === "increase",
                      "text-error": stat.change.type === "decrease",
                      "text-muted-foreground": stat.change.type === "neutral",
                    }
                  )}
                >
                  {getChangeIcon(stat.change.type)}
                  {stat.change.value}
                </span>
                {stat.change.period && (
                  <span className="text-xs text-muted-foreground">
                    {stat.change.period}
                  </span>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <div className={cn("grid gap-6", gridClasses[columns], className)}>
        {stats.map((stat) => (
          <MetricCard
            key={stat.id}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            icon={stat.icon}
            trend={stat.trend && renderMiniTrend(stat.trend)}
            className="animate-fade-in"
          />
        ))}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn(
      "grid gap-4 sm:gap-6",
      gridClasses[columns],
      className
    )}>
      {stats.map((stat, index) => (
        <Card
          key={stat.id}
          className="group hover:shadow-modern-lg transition-all duration-300 animate-fade-in"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium text-muted-foreground tracking-tight">
                {stat.title}
              </h3>
              {stat.icon && (
                <div className={cn(
                  "p-2 rounded-lg transition-colors duration-200",
                  {
                    "bg-primary/10 text-primary": stat.color === "primary" || !stat.color,
                    "bg-success/10 text-success": stat.color === "success",
                    "bg-yellow-100 text-yellow-600": stat.color === "warning",
                    "bg-error/10 text-error": stat.color === "error",
                  }
                )}>
                  {stat.icon}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold tracking-tight group-hover:text-primary transition-colors duration-200">
                  {stat.value}
                </p>
                {stat.change && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                      {
                        "bg-success/10 text-success": stat.change.type === "increase",
                        "bg-error/10 text-error": stat.change.type === "decrease",
                        "bg-muted text-muted-foreground": stat.change.type === "neutral",
                      }
                    )}
                  >
                    {getChangeIcon(stat.change.type)}
                    {stat.change.value}
                  </span>
                )}
              </div>
              
              {stat.description && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {stat.description}
                </p>
              )}
              
              {stat.change?.period && (
                <p className="text-xs text-muted-foreground">
                  {stat.change.period}
                </p>
              )}
              
              {stat.trend && (
                <div className="pt-2">
                  {renderMiniTrend(stat.trend)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
