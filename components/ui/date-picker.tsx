"useClient";

import { useComponentAccessibility } from "@/hooks/use-component-accessibility";
import { cn } from "@/lib/utils";
import {
  addTime,
  dateToEpoch,
  epochToDate,
  getLocalTimezone,
  isSameDate,
  subtractTime
} from "@/lib/utils/date";
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  getMonth,
  getYear,
  isBefore,
  isSameDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { toZonedTime as utcToZonedTime } from "date-fns-tz";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "./button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

type Option = {
  value: number | string;
  label: string;
  disabled?: boolean;
};

export interface DatePickerProps {
  value?: number; // Epoch timestamp (ms) - stored in UTC
  onChange?: (epoch: number | undefined) => void;
  onChangeDate?: (date: Date | undefined) => void; // Returns UTC Date for storage
  minDate?: number | string; // Epoch timestamp (ms) or ISO string
  maxDate?: number | string; // Epoch timestamp (ms) or ISO string
  disabledDates?: (number | string)[];
  timezone?: string; // IANA timezone for display (defaults to user's local)
  className?: string;
}

const MONTHS = [
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

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  onChangeDate,
  minDate,
  maxDate,
  disabledDates = [],
  timezone,
  className,
}) => {
  const userTimezone = timezone || getLocalTimezone();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const { ariaProps } = useComponentAccessibility({
    componentType: "date-picker",
  });

  // Initialize selected date from value (convert UTC epoch to user timezone for display)
  useEffect(() => {
    if (value !== undefined && value !== 0) {
      const utcDate = epochToDate(value);
      const userDate = utcToZonedTime(utcDate, userTimezone);
      setSelectedDate(userDate);
      setCurrentMonth(userDate);
    } else {
      setSelectedDate(null);
      setCurrentMonth(new Date());
    }
  }, [value, userTimezone]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const weekStart = startOfWeek(monthStart);
    const weekEnd = endOfWeek(monthEnd);

    const days: Date[] = [];
    let current = weekStart;

    while (isBefore(current, weekEnd) || isSameDay(current, weekEnd)) {
      days.push(current);
      current = addDays(current, 1);
    }

    return days;
  }, [currentMonth]);

  // Generate month options for Select
  const monthOptions = useMemo((): Option[] => {
    return MONTHS.map((month, index) => ({
      value: index,
      label: month,
    }));
  }, []);

  // Generate year options for Select
  const yearOptions = useMemo((): Option[] => {
    const currentYear = getYear(new Date());
    const yearRange = 100;
    const startYear = currentYear - yearRange;
    const endYear = currentYear + yearRange;

    return Array.from({ length: endYear - startYear + 1 }, (_, i) => {
      const year = startYear + i;
      return {
        value: year,
        label: year.toString(),
        disabled: false,
      };
    });
  }, []);

  // Check if date is disabled
  const isDateDisabled = useCallback(
    (date: Date): boolean => {
      const epoch = date.getTime();

      // Check minDate
      if (minDate) {
        const minEpoch =
          typeof minDate === "string" ? dateToEpoch(minDate) : minDate;
        if (epoch < minEpoch) return true;
      }

      // Check maxDate
      if (maxDate) {
        const maxEpoch =
          typeof maxDate === "string" ? dateToEpoch(maxDate) : maxDate;
        if (epoch > maxEpoch) return true;
      }

      // Check disabledDates
      return disabledDates.some((disabledDate) => {
        const disabledEpoch =
          typeof disabledDate === "string"
            ? dateToEpoch(disabledDate)
            : disabledDate;
        const disabledDateObj = epochToDate(disabledEpoch);
        return isSameDate(date, disabledDateObj);
      });
    },
    [minDate, maxDate, disabledDates]
  );

  // Navigate to previous month
  const goToPreviousMonth = useCallback(() => {
    setCurrentMonth((prev) => subtractTime.days(prev, 30)); // Approximate month navigation
  }, []);

  // Navigate to next month
  const goToNextMonth = useCallback(() => {
    setCurrentMonth((prev) => addTime.days(prev, 30)); // Approximate month navigation
  }, []);

  // Handle month selection
  const handleMonthSelect = useCallback(
    (value: string) => {
      const monthIndex = parseInt(value.toString());
      const currentYear = getYear(currentMonth);
      const newMonth = new Date(currentYear, monthIndex, 1);
      setCurrentMonth(newMonth);
    },
    [currentMonth]
  );

  // Handle year selection
  const handleYearSelect = useCallback(
    (value: string) => {
      const year = parseInt(value.toString());
      const currentMonthIndex = getMonth(currentMonth);
      const newDate = new Date(year, currentMonthIndex, 1);
      setCurrentMonth(newDate);
    },
    [currentMonth]
  );

  // Handle date selection
  const handleDateSelect = useCallback(
    (date: Date) => {
      if (isDateDisabled(date)) return;

      const epoch = date.getTime();
      setSelectedDate(date);

      if (onChange) {
        onChange(epoch);
      }

      if (onChangeDate) {
        // Convert user timezone date back to UTC for storage
        onChangeDate(date);
      }
    },
    [isDateDisabled, onChange, onChangeDate]
  );

  return (
    <div
      ref={calendarRef}
      className={cn(className)}
      role="dialog"
      aria-label="Date picker"
      aria-modal="true"
      tabIndex={-1}
      {...ariaProps}
    >
      {/* Calendar Header */}
      <div className="mb-2 flex items-center justify-between p-2">
        <Button
          variant="link"
          onClick={goToPreviousMonth}
          aria-label="Previous month"
          className="size-8 p-1"
        >
          <ChevronLeftIcon />
        </Button>

        <div className="flex items-center gap-2">
          {/* Month Selector */}
          <div className="w-32">
            <Select
              defaultValue={getMonth(currentMonth).toString()}
              onValueChange={handleMonthSelect}
            >
              <SelectTrigger className="border-[#dbdade]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent searchable>
                {monthOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value.toString()}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year Selector */}
          <div className="w-24">
            <Select
              defaultValue={getYear(currentMonth).toString()}
              onValueChange={handleYearSelect}
            >
              <SelectTrigger className="border-[#dbdade]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent searchable>
                {yearOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value.toString()}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          variant="link"
          onClick={goToNextMonth}
          aria-label="Next month"
          className="size-8 p-1"
        >
          <ChevronRightIcon />
        </Button>
      </div>

      {/* Days of Week */}
      <div className="grid grid-cols-7 gap-0.5 px-2 text-center">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-text-muted p-1 text-center text-xs font-medium"
          >
            {day}
          </div>
        ))}
        {calendarDays.map((day) => {
          const isSelected = selectedDate
            ? isSameDate(selectedDate, day)
            : false;
          const isDisabled = isDateDisabled(day);
          const isCurrentMonth = getMonth(day) === getMonth(currentMonth);
          const isToday = isSameDate(day, new Date());

          return (
            <div key={day.getTime()}>
              <Button
                variant="ghost"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                onClick={() => {
                  if (!isDisabled) handleDateSelect(day);
                }}
                disabled={isDisabled}
                className={cn(
                  "h-7 w-7 p-0.5 rounded-lg text-sm font-medium transition-colors focus:ring-2 focus:outline-none no-underline text-primary",
                  isSelected &&
                    "bg-primary hover:bg-primary focus:ring-accent-foreground text-primary-foreground hover:text-primary-foreground",
                  !isSelected &&
                    !isDisabled &&
                    "hover:bg-primary/20 hover:text-primary",
                  isDisabled && "cursor-not-allowed opacity-50",
                  !isCurrentMonth && "text-primary/50 hover:text-primary/70",
                  isToday && !isSelected && "ring-secondary-300 ring-2"
                )}
                aria-label={`Select ${format(day, "MMMM d, yyyy")}`}
                aria-selected={isSelected}
              >
                {format(day, "d")}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
