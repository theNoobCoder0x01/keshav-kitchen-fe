"use client";

import { eachDayOfInterval, endOfMonth, startOfMonth } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { DayPicker, DropdownProps } from "react-day-picker";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type EnhancedCalendarProps = React.ComponentProps<typeof DayPicker> & {
  showWeekNumbers?: boolean;
  showMonthDropdown?: boolean;
  showYearDropdown?: boolean;
  variant?: "default" | "compact" | "minimal";
  size?: "sm" | "md" | "lg";
};

function EnhancedCalendar({
  className,
  classNames,
  showOutsideDays = true,
  showWeekNumbers = false,
  showMonthDropdown = true,
  showYearDropdown = true,
  variant = "default",
  size = "md",
  ...props
}: EnhancedCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());

  // Get size classes
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return {
          container: "p-2",
          caption: "pb-2",
          captionLabel: "text-sm font-semibold",
          navButton: "h-6 w-6",
          navIcon: "h-3 w-3",
          headCell: "w-8 h-8 text-xs",
          cell: "h-8 w-8",
          day: "h-8 w-8 text-sm",
          weekNumber: "w-6 text-xs",
        };
      case "lg":
        return {
          container: "p-6",
          caption: "pb-6",
          captionLabel: "text-lg font-semibold",
          navButton: "h-10 w-10",
          navIcon: "h-5 w-5",
          headCell: "w-12 h-12 text-base",
          cell: "h-12 w-12",
          day: "h-12 w-12 text-base",
          weekNumber: "w-8 text-sm",
        };
      default: // md
        return {
          container: "p-4",
          caption: "pb-4",
          captionLabel: "text-base font-semibold",
          navButton: "h-8 w-8",
          navIcon: "h-4 w-4",
          headCell: "w-10 h-10 text-sm",
          cell: "h-10 w-10",
          day: "h-10 w-10 text-sm",
          weekNumber: "w-7 text-xs",
        };
    }
  };

  const sizeClasses = getSizeClasses();

  // Get variant classes
  const getVariantClasses = () => {
    switch (variant) {
      case "compact":
        return {
          container: "bg-background/50 backdrop-blur-sm",
          caption: "bg-muted/30 rounded-t-lg",
          day: "hover:bg-primary/5 hover:text-primary",
          selected: "bg-primary/80 text-primary-foreground shadow-sm",
          today: "bg-accent/50 text-accent-foreground border border-primary/20",
        };
      case "minimal":
        return {
          container: "bg-transparent",
          caption: "bg-transparent",
          day: "hover:bg-muted/50 hover:text-foreground",
          selected: "bg-primary text-primary-foreground",
          today: "bg-muted text-foreground font-medium",
        };
      default:
        return {
          container: "bg-card/80 backdrop-blur-sm border border-border/50",
          caption: "bg-muted/20 rounded-t-lg border-b border-border/50",
          day: "hover:bg-primary/10 hover:text-primary",
          selected:
            "bg-primary text-primary-foreground shadow-lg shadow-primary/25",
          today:
            "bg-accent text-accent-foreground font-semibold border-2 border-primary/30",
        };
    }
  };

  const variantClasses = getVariantClasses();

  // Custom month dropdown component
  const MonthDropdown = ({
    value,
    onChange,
    children,
    ...props
  }: DropdownProps) => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    return (
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn(
          "bg-transparent border-none text-foreground font-semibold cursor-pointer",
          "focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-1",
          sizeClasses.captionLabel,
        )}
        {...props}
      >
        {months.map((month, index) => (
          <option key={month} value={index}>
            {month}
          </option>
        ))}
      </select>
    );
  };

  // Custom year dropdown component
  const YearDropdown = ({
    value,
    onChange,
    children,
    ...props
  }: DropdownProps) => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 20 }, (_, i) => currentYear - 10 + i);

    return (
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn(
          "bg-transparent border-none text-foreground font-semibold cursor-pointer",
          "focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-1",
          sizeClasses.captionLabel,
        )}
        {...props}
      >
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    );
  };

  // Get week numbers for the current month
  const getWeekNumbers = (month: Date) => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const days = eachDayOfInterval({ start, end });

    const weeks: number[] = [];
    let currentWeek = 1;

    days.forEach((day, index) => {
      if (index === 0 || day.getDay() === 0) {
        weeks.push(currentWeek);
        currentWeek++;
      }
    });

    return weeks;
  };

  return (
    <div
      className={cn(
        "rounded-lg shadow-sm",
        variantClasses.container,
        sizeClasses.container,
        className,
      )}
    >
      <DayPicker
        showOutsideDays={showOutsideDays}
        showWeekNumber={showWeekNumbers}
        className="w-full"
        classNames={{
          months:
            "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: cn(
            "flex justify-center pt-3 relative items-center",
            variantClasses.caption,
            sizeClasses.caption,
          ),
          caption_label: cn("text-foreground", sizeClasses.captionLabel),
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            buttonVariants({ variant: "outline" }),
            "bg-background/80 border-border/50 hover:bg-muted hover:border-primary/50",
            "p-0 opacity-70 hover:opacity-100 transition-all duration-200",
            "focus:ring-2 focus:ring-primary/20 focus:ring-offset-2",
            sizeClasses.navButton,
          ),
          nav_button_previous: "absolute left-2",
          nav_button_next: "absolute right-2",
          table: "w-full border-collapse space-y-1",
          head_row: "flex mb-2",
          head_cell: cn(
            "text-muted-foreground font-medium flex items-center justify-center",
            "rounded-md transition-colors",
            sizeClasses.headCell,
          ),
          row: "flex w-full mt-1",
          cell: cn(
            "relative p-0 text-center focus-within:relative focus-within:z-20",
            sizeClasses.cell,
          ),
          day: cn(
            buttonVariants({ variant: "ghost" }),
            "p-0 font-normal text-foreground transition-all duration-200 rounded-lg",
            "focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 focus:ring-offset-background",
            "hover:scale-105 active:scale-95",
            variantClasses.day,
            sizeClasses.day,
          ),
          day_range_end: "day-range-end",
          day_selected: cn(
            "hover:bg-primary/90 hover:text-primary-foreground",
            "focus:bg-primary/90 focus:text-primary-foreground",
            "scale-105 shadow-lg",
            variantClasses.selected,
          ),
          day_today: cn(
            "hover:bg-primary/10 hover:text-primary hover:border-primary/50",
            variantClasses.today,
          ),
          day_outside: cn(
            "text-muted-foreground opacity-50",
            "aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
          ),
          day_disabled: cn(
            "text-muted-foreground opacity-30 cursor-not-allowed",
            "hover:bg-transparent hover:scale-100",
          ),
          day_range_middle:
            "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
          weeknumber: cn(
            "text-muted-foreground font-medium text-center",
            sizeClasses.weekNumber,
          ),
          ...classNames,
        }}
        components={{
          IconLeft: ({ ...props }) => (
            <div className="flex items-center justify-center w-full h-full">
              <ChevronLeft className={sizeClasses.navIcon} />
            </div>
          ),
          IconRight: ({ ...props }) => (
            <div className="flex items-center justify-center w-full h-full">
              <ChevronRight className={sizeClasses.navIcon} />
            </div>
          ),
          ...(showMonthDropdown && { Dropdown: MonthDropdown }),
          ...(showYearDropdown && { Dropdown: YearDropdown }),
        }}
        {...props}
      />
    </div>
  );
}
EnhancedCalendar.displayName = "EnhancedCalendar";

export { EnhancedCalendar as Calendar, EnhancedCalendar };
