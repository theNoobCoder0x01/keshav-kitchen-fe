"use client";

import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import * as React from "react";
import { DayPicker } from "react-day-picker";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type EnhancedCalendarProps = React.ComponentProps<typeof DayPicker>;

function EnhancedCalendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: EnhancedCalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center pb-4",
        caption_label: "text-base font-semibold text-foreground",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 bg-background border-border hover:bg-muted hover:border-primary/50 p-0 opacity-70 hover:opacity-100 transition-all duration-200",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex mb-2",
        head_cell:
          "text-muted-foreground rounded-md w-10 h-10 font-medium text-sm flex items-center justify-center",
        row: "flex w-full mt-1",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
          "h-10 w-10"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-10 p-0 font-normal text-foreground hover:bg-primary/10 hover:text-primary transition-all duration-200 rounded-lg",
          "focus:bg-primary/10 focus:text-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 focus:ring-offset-background"
        ),
        day_range_end: "day-range-end",
        day_selected: cn(
          "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
          "focus:bg-primary/90 focus:text-primary-foreground",
          "shadow-lg shadow-primary/25"
        ),
        day_today: cn(
          "bg-accent text-accent-foreground font-semibold",
          "border-2 border-primary/30",
          "hover:bg-primary/10 hover:text-primary hover:border-primary/50"
        ),
        day_outside: cn(
          "text-muted-foreground opacity-50",
          "aria-selected:bg-accent/50 aria-selected:text-muted-foreground"
        ),
        day_disabled: "text-muted-foreground opacity-30 cursor-not-allowed hover:bg-transparent",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => (
          <div className="flex items-center justify-center w-full h-full">
            <ChevronLeft className="h-4 w-4" />
          </div>
        ),
        IconRight: ({ ...props }) => (
          <div className="flex items-center justify-center w-full h-full">
            <ChevronRight className="h-4 w-4" />
          </div>
        ),
      }}
      {...props}
    />
  );
}
EnhancedCalendar.displayName = "EnhancedCalendar";

export { EnhancedCalendar as Calendar };