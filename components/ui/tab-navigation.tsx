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
    <div className={cn("mb-6 sm:mb-8", className)}>
      {/* Mobile Dropdown */}
      <div className="sm:hidden">
        <select
          value={activeTab}
          onChange={(e) => handleTabClick(Number(e.target.value))}
          className="w-full p-3 border border-[#dbdade] rounded-xl bg-white text-[#4b465c] focus:border-[#674af5] focus:ring-[#674af5]/20"
        >
          {tabs.map((tab, index) => (
            <option key={tab} value={index}>
              {tab}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop Tabs */}
      <div className="hidden sm:flex space-x-1 bg-white/50 backdrop-blur-sm p-1 rounded-xl border border-[#dbdade]/50">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            onClick={() => handleTabClick(index)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 flex-1 sm:flex-none",
              index === activeTab
                ? "bg-white text-[#674af5] shadow-sm border border-[#674af5]/10"
                : "text-[#4b465c]/70 hover:text-[#4b465c] hover:bg-white/50",
            )}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}
