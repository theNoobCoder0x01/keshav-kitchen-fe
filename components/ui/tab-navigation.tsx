"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "./button";
import { Skeleton } from "./skeleton";

interface TabNavigationProps {
  tabs: string[];
  activeTab?: number;
  onTabChange?: (index: number) => void;
  className?: string;
}

export function TabNavigation({
  tabs,
  activeTab: controlledActiveTab,
  onTabChange,
  className = "",
}: TabNavigationProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(0);

  const activeTab =
    controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;

  const handleTabClick = (index: number) => {
    if (controlledActiveTab === undefined) {
      setInternalActiveTab(index);
    }
    onTabChange?.(index);
  };

  return (
    <div className={cn(className)}>
      {/* Mobile Dropdown */}
      <div className="sm:hidden">
        <Select
          value={String(activeTab)}
          onValueChange={(val) => handleTabClick(Number(val))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select tab" />
          </SelectTrigger>
          <SelectContent>
            {tabs.map((tab, index) => (
              <SelectItem key={tab} value={String(index)}>
                {tab}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop Tabs */}
      <div className="hidden sm:flex space-x-1 bg-card backdrop-blur-xs p-1 rounded-xl border border-border/50">
        {tabs.map((tab, index) => (
          <Button
            variant="link"
            key={tab}
            onClick={() => handleTabClick(index)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 flex-1 sm:flex-none",
              index === activeTab
                ? "bg-accent text-primary shadow-xs border border-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/80",
            )}
          >
            {tab}
          </Button>
        ))}
      </div>
    </div>
  );
}

// Skeleton loader for TabNavigation
export function TabNavigationSkeleton({
  tabCount = 3,
  className = "",
}: {
  tabCount?: number;
  className?: string;
}) {
  return (
    <div className={cn(className)}>
      {/* Mobile Dropdown Skeleton */}
      <div className="sm:hidden">
        <Skeleton className="w-full h-10 rounded-xl" />
      </div>
      {/* Desktop Tabs Skeleton */}
      <div className="hidden sm:flex space-x-1 bg-card backdrop-blur-xs p-1 rounded-xl border border-border/50">
        {Array.from({ length: tabCount }).map((_, idx) => (
          <Skeleton
            key={idx}
            className="px-4 py-2.5 h-10 w-24 rounded-lg flex-1 sm:flex-none"
          />
        ))}
      </div>
    </div>
  );
}
