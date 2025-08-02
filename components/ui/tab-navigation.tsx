"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

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
    <div className={cn("mb-8", className)}>
      {/* Mobile Dropdown */}
      <div className="sm:hidden">
        <select
          value={activeTab}
          onChange={(e) => handleTabClick(Number(e.target.value))}
          className="w-full p-4 glass rounded-xl border-0 focus-ring text-foreground"
        >
          {tabs.map((tab, index) => (
            <option key={tab} value={index}>
              {tab}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop Tabs */}
      <div className="hidden sm:flex space-x-1 glass p-1 rounded-xl border-0 shadow-modern">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            onClick={() => handleTabClick(index)}
            className={cn(
              "px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 flex-1 sm:flex-none btn-hover",
              index === activeTab
                ? "bg-white text-primary shadow-modern border border-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-white/50",
            )}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}