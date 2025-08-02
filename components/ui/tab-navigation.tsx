"use client";

import { cn } from "@/lib/utils";
import { Button } from "./button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface TabNavigationProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  variant?: "default" | "pills" | "underline" | "cards";
  size?: "sm" | "md" | "lg";
  scrollable?: boolean;
  fullWidth?: boolean;
}

export function TabNavigation({
  tabs,
  activeTab,
  onTabChange,
  className,
  variant = "default",
  size = "md",
  scrollable = true,
  fullWidth = false,
}: TabNavigationProps) {
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Check scroll buttons visibility
  const checkScrollButtons = () => {
    if (!scrollContainerRef.current || !scrollable) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftButton(scrollLeft > 0);
    setShowRightButton(scrollLeft < scrollWidth - clientWidth);
  };

  useEffect(() => {
    checkScrollButtons();
    const handleResize = () => checkScrollButtons();
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [tabs, scrollable]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    
    const scrollAmount = 200;
    const newScrollLeft = direction === "left" 
      ? scrollContainerRef.current.scrollLeft - scrollAmount
      : scrollContainerRef.current.scrollLeft + scrollAmount;
    
    scrollContainerRef.current.scrollTo({
      left: newScrollLeft,
      behavior: "smooth",
    });
  };

  // Touch/mouse drag scrolling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollable) return;
    setIsDragging(true);
    setStartX(e.pageX - (scrollContainerRef.current?.offsetLeft || 0));
    setScrollLeft(scrollContainerRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - (scrollContainerRef.current.offsetLeft || 0);
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Base tab styles
  const getTabStyles = () => {
    const baseStyles = cn(
      "relative inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      {
        "px-3 py-2 text-sm": size === "sm",
        "px-4 py-3 text-sm": size === "md",
        "px-6 py-4 text-base": size === "lg",
      }
    );

    switch (variant) {
      case "pills":
        return cn(
          baseStyles,
          "rounded-full font-medium",
          "hover:bg-muted hover:text-foreground",
          "data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:shadow-modern"
        );
      
      case "underline":
        return cn(
          baseStyles,
          "rounded-none border-b-2 border-transparent font-medium",
          "hover:border-muted-foreground/50 hover:text-foreground",
          "data-[active=true]:border-primary data-[active=true]:text-primary"
        );
      
      case "cards":
        return cn(
          baseStyles,
          "rounded-lg border border-transparent font-medium bg-background",
          "hover:border-border hover:bg-muted/50",
          "data-[active=true]:border-primary data-[active=true]:bg-primary/5 data-[active=true]:text-primary data-[active=true]:shadow-modern"
        );
      
      default:
        return cn(
          baseStyles,
          "rounded-lg font-medium",
          "hover:bg-muted hover:text-foreground",
          "data-[active=true]:bg-background data-[active=true]:text-primary data-[active=true]:shadow-modern"
        );
    }
  };

  const containerStyles = cn(
    "flex items-center",
    {
      "border-b border-border": variant === "underline",
      "p-1 bg-muted rounded-xl": variant === "default",
      "gap-2": variant === "pills" || variant === "cards",
      "gap-0": variant === "underline" || variant === "default",
    },
    fullWidth && "w-full",
    className
  );

  const tabListStyles = cn(
    "flex items-center",
    {
      "flex-1": fullWidth,
      "gap-1": variant === "default",
      "gap-2": variant === "pills" || variant === "cards",
      "gap-0": variant === "underline",
    },
    scrollable ? "overflow-x-auto scrollbar-hide" : "flex-wrap",
    fullWidth && "w-full"
  );

  return (
    <div className={containerStyles}>
      {/* Left scroll button */}
      {scrollable && showLeftButton && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => scroll("left")}
          className="flex-shrink-0 mr-2"
          aria-label="Scroll tabs left"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      )}

      {/* Tab list */}
      <div
        ref={scrollContainerRef}
        className={tabListStyles}
        onScroll={checkScrollButtons}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? "grabbing" : scrollable ? "grab" : "default" }}
        role="tablist"
        aria-label="Navigation tabs"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            tabIndex={tab.disabled ? -1 : 0}
            aria-selected={activeTab === tab.id}
            aria-disabled={tab.disabled}
            data-active={activeTab === tab.id}
            className={cn(
              getTabStyles(),
              fullWidth && "flex-1 min-w-0",
              tab.disabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            disabled={tab.disabled}
          >
            {tab.icon && (
              <span className="flex-shrink-0">
                {tab.icon}
              </span>
            )}
            <span className={cn(
              "truncate",
              fullWidth ? "min-w-0" : "whitespace-nowrap"
            )}>
              {tab.label}
            </span>
            {tab.count !== undefined && (
              <span className={cn(
                "flex-shrink-0 ml-1 px-2 py-0.5 text-xs font-medium rounded-full",
                activeTab === tab.id 
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Right scroll button */}
      {scrollable && showRightButton && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => scroll("right")}
          className="flex-shrink-0 ml-2"
          aria-label="Scroll tabs right"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

// Specialized tab navigation variants
export function SegmentedControl({
  tabs,
  activeTab,
  onTabChange,
  className,
  size = "md",
}: Omit<TabNavigationProps, "variant" | "scrollable" | "fullWidth">) {
  return (
    <TabNavigation
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={onTabChange}
      variant="default"
      size={size}
      scrollable={false}
      fullWidth={true}
      className={className}
    />
  );
}

export function PillTabs({
  tabs,
  activeTab,
  onTabChange,
  className,
  size = "md",
}: Omit<TabNavigationProps, "variant">) {
  return (
    <TabNavigation
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={onTabChange}
      variant="pills"
      size={size}
      className={className}
    />
  );
}