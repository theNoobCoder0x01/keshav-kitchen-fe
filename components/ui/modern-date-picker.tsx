"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarComponent } from "@/components/ui/enhanced-calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { addDays, format, subDays } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useState } from "react";

interface ModernDatePickerProps {
  date?: Date;
  onDateChange?: (date: Date) => void;
  className?: string;
  variant?: "inline" | "popover" | "compact";
  showNavigation?: boolean;
  showToday?: boolean;
  placeholder?: string;
}

export function ModernDatePicker({
  date: initialDate,
  onDateChange,
  className,
  variant = "popover",
  showNavigation = true,
  showToday = true,
  placeholder = "Select date",
}: ModernDatePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(
    initialDate || new Date(),
  );
  const [isOpen, setIsOpen] = useState(false);

  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
    onDateChange?.(newDate);
  };

  const goToPreviousDay = () => {
    const newDate = subDays(selectedDate, 1);
    handleDateChange(newDate);
  };

  const goToNextDay = () => {
    const newDate = addDays(selectedDate, 1);
    handleDateChange(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    handleDateChange(today);
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      handleDateChange(date);
      if (variant === "popover") {
        setIsOpen(false);
      }
    }
  };

  const formatDate = (date: Date) => {
    return format(date, "EEEE, MMMM d, yyyy");
  };

  const formatShortDate = (date: Date) => {
    return format(date, "MMM d, yyyy");
  };

  const formatDay = (date: Date) => {
    return format(date, "EEEE");
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  if (variant === "inline") {
    return (
      <Card
        className={cn(
          "bg-card/80 backdrop-blur-sm border-border/50",
          className,
        )}
      >
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-md">
                  <Calendar className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-primary">
                    {formatShortDate(selectedDate)}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {formatDay(selectedDate)}
                    {isToday(selectedDate) && (
                      <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full text-xs">
                        <Clock className="w-3 h-3" />
                        Today
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {showNavigation && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-8 h-8 p-0 hover:bg-primary/10 rounded-lg transition-colors"
                    onClick={goToPreviousDay}
                  >
                    <ChevronLeft className="w-4 h-4 text-primary" />
                  </Button>
                  {showToday && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="px-3 text-xs"
                      onClick={goToToday}
                    >
                      Today
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-8 h-8 p-0 hover:bg-primary/10 rounded-lg transition-colors"
                    onClick={goToNextDay}
                  >
                    <ChevronRight className="w-4 h-4 text-primary" />
                  </Button>
                </div>
              )}
            </div>

            {/* Calendar */}
            <div className="border-t border-border/50 pt-4">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={handleCalendarSelect}
                initialFocus
                className="rounded-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === "compact") {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="p-0 h-auto hover:bg-transparent text-left justify-start"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-sm">
                <Calendar className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-primary">
                  {formatShortDate(selectedDate)}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {formatDay(selectedDate)}
                </p>
              </div>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="bg-background border border-border rounded-lg shadow-lg">
            <div className="p-3 border-b border-border bg-muted/30">
              <h3 className="text-sm font-semibold text-foreground">
                Select Date
              </h3>
            </div>
            <div className="p-2">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={handleCalendarSelect}
                initialFocus
                className="rounded-md"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Default popover variant
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            "border-border hover:border-primary/50 hover:bg-muted/50",
            "focus:ring-2 focus:ring-primary/20 focus:ring-offset-2",
            "transition-all duration-200",
            className,
          )}
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span
              className={
                selectedDate ? "text-foreground" : "text-muted-foreground"
              }
            >
              {selectedDate ? formatDate(selectedDate) : placeholder}
            </span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
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
              selected={selectedDate}
              onSelect={handleCalendarSelect}
              initialFocus
              className="rounded-md"
            />
          </div>
          {selectedDate && (
            <div className="p-3 border-t border-border bg-muted/20">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Selected: {formatDate(selectedDate)}
                </span>
                {showToday && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goToToday}
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Today
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
