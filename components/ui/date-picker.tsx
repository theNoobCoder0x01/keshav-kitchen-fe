"useClient";

import { useComponentAccessibility } from "@/hooks/use-component-accessibility";
import { cn } from "@/lib/utils";
import { dateToEpoch } from "@/lib/utils/date";
import dayjs from "dayjs";
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
  value?: number; // Epoch timestamp (ms)
  onChange?: (epoch: number | undefined) => void;
  onChangeDate?: (date: Date | undefined) => void;
  minDate?: number | string; // Epoch timestamp (ms) or ISO string
  maxDate?: number | string; // Epoch timestamp (ms) or ISO string
  disabledDates?: (number | string)[];
  timezone?: string;
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
  const [currentMonth, setCurrentMonth] = useState<dayjs.Dayjs>(dayjs());
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const { ariaProps } = useComponentAccessibility({
    componentType: "date-picker",
  });

  // Initialize selected date from value
  useEffect(() => {
    if (value !== undefined && value !== 0) {
      const date = timezone ? dayjs(value).tz(timezone) : dayjs(value);
      setSelectedDate(date);
      setCurrentMonth(date);
    } else {
      setSelectedDate(null);
      setCurrentMonth(dayjs());
    }
  }, [value, timezone]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const startOfMonth = currentMonth.startOf("month");
    const endOfMonth = currentMonth.endOf("month");
    const startOfWeek = startOfMonth.startOf("week");
    const endOfWeek = endOfMonth.endOf("week");

    const days: dayjs.Dayjs[] = [];
    let current = startOfWeek;

    while (current.isBefore(endOfWeek) || current.isSame(endOfWeek, "day")) {
      days.push(current);
      current = current.add(1, "day");
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
    const currentYear = dayjs().year();
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
    (date: dayjs.Dayjs): boolean => {
      const epoch = date.valueOf();

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
        return date.isSame(dayjs(disabledEpoch), "day");
      });
    },
    [minDate, maxDate, disabledDates],
  );

  // Navigate to previous month
  const goToPreviousMonth = useCallback(() => {
    setCurrentMonth((prev) => prev.subtract(1, "month"));
  }, []);

  // Navigate to next month
  const goToNextMonth = useCallback(() => {
    setCurrentMonth((prev) => prev.add(1, "month"));
  }, []);

  // Handle month selection
  const handleMonthSelect = useCallback(
    (value: string) => {
      const newMonth = dayjs()
        .month(parseInt(value.toString()))
        .year(currentMonth.year());
      setCurrentMonth(newMonth);
    },
    [currentMonth],
  );

  // Handle year selection
  const handleYearSelect = useCallback(
    (value: string) => {
      const newDate = currentMonth.year(parseInt(value.toString()));
      setCurrentMonth(newDate);
    },
    [currentMonth],
  );

  // Handle date selection
  const handleDateSelect = useCallback(
    (date: dayjs.Dayjs) => {
      if (isDateDisabled(date)) return;

      const epoch = date.valueOf();
      setSelectedDate(date);

      if (onChange) {
        onChange(epoch);
      }

      if (onChangeDate) {
        onChangeDate(date.toDate());
      }
    },
    [isDateDisabled, onChange, onChangeDate],
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
              defaultValue={currentMonth.month().toString()}
              onValueChange={handleMonthSelect}
            >
              <SelectTrigger className="border-[#dbdade]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
              defaultValue={currentMonth.year().toString()}
              onValueChange={handleYearSelect}
            >
              <SelectTrigger className="border-[#dbdade]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
          const isSelected = selectedDate?.isSame(day, "day");
          const isDisabled = isDateDisabled(day);
          const isCurrentMonth = day.isSame(currentMonth, "month");
          const isToday = day.isSame(dayjs(), "day");

          return (
            <div key={day.valueOf()}>
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
                  isToday && !isSelected && "ring-secondary-300 ring-2",
                )}
                aria-label={`Select ${day.format("MMMM D, YYYY")}`}
                aria-selected={isSelected}
              >
                {day.format("D")}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
