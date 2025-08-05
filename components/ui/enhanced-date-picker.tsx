"use client";

import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/enhanced-calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar, ChevronDown } from "lucide-react";
import { useState } from "react";

interface EnhancedDatePickerProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showIcon?: boolean;
  variant?: "default" | "compact" | "minimal";
}

export function EnhancedDatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  className,
  disabled = false,
  showIcon = true,
  variant = "default",
}: EnhancedDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (selectedDate: Date | undefined) => {
    onDateChange?.(selectedDate);
    setIsOpen(false);
  };

  const getVariantClasses = () => {
    switch (variant) {
      case "compact":
        return "h-9 px-3 text-sm";
      case "minimal":
        return "h-8 px-2 text-sm border-0 bg-transparent hover:bg-muted";
      default:
        return "h-10 px-3";
    }
  };

  const getTriggerContent = () => {
    if (variant === "minimal") {
      return (
        <div className="flex items-center gap-2">
          {showIcon && <Calendar className="h-4 w-4 text-muted-foreground" />}
          <span
            className={cn(
              "text-sm",
              date ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {date ? format(date, "PPP") : placeholder}
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        {showIcon && <Calendar className="h-4 w-4 text-muted-foreground" />}
        <span
          className={cn(date ? "text-foreground" : "text-muted-foreground")}
        >
          {date ? format(date, "PPP") : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={variant === "minimal" ? "ghost" : "outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            "border-border hover:border-primary/50 hover:bg-muted/50",
            "focus:ring-2 focus:ring-primary/20 focus:ring-offset-2",
            "transition-all duration-200",
            getVariantClasses(),
            className,
          )}
          disabled={disabled}
        >
          {getTriggerContent()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
        <div className="bg-background border border-border rounded-lg shadow-lg">
          <div className="p-3 border-b border-border bg-muted/30">
            <h3 className="text-sm font-semibold text-foreground">
              Select Date
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Choose a date from the calendar below
            </p>
          </div>
          <div className="p-2">
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={handleSelect}
              initialFocus
              className="rounded-md"
            />
          </div>
          {date && (
            <div className="p-3 border-t border-border bg-muted/20">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Selected: {format(date, "EEEE, MMMM d, yyyy")}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSelect(undefined)}
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
