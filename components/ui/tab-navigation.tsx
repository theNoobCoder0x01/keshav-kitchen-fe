"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

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
    <div className={cn("mb-6 sm:mb-8", className)}>
      {/* Mobile Dropdown */}
      <div className="sm:hidden">
        <select
          value={activeTab}
          onChange={(e) => handleTabClick(Number(e.target.value))}
          className="w-full p-3 border border-border rounded-xl bg-background text-foreground focus:border-primary focus:ring-primary/20"
        >
          {tabs.map((tab, index) => (
            <option key={tab} value={index}>
              {tab}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop Tabs */}
      <div className="hidden sm:flex space-x-1 bg-background/50 backdrop-blur-sm p-1 rounded-xl border border-border/50">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            onClick={() => handleTabClick(index)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 flex-1 sm:flex-none",
              index === activeTab
                ? "bg-background text-primary shadow-sm border border-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50",
            )}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}
