"use client";

import { StatsCard } from "./stats-card";
import type { LucideIcon } from "lucide-react";

interface StatData {
  label: string;
  value: string;
  icon: LucideIcon;
  iconColor: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

interface StatsGridProps {
  stats: StatData[];
  className?: string;
}

export function StatsGrid({ stats, className }: StatsGridProps) {
  return (
    <div
      className={`grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 ${className}`}
    >
      {stats.map((stat, index) => stat && <StatsCard key={index} {...stat} />)}
    </div>
  );
}
