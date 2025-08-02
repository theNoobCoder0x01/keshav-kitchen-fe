"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useState } from "react";
import { format, addDays, subDays } from "date-fns";
import { cn } from "@/lib/utils";

interface DateSelectorProps {
  date?: Date;
  onDateChange?: (date: Date) => void;
  subtitle?: string;
  className?: string;
}

export function DateSelector({
  date: initialDate,
  onDateChange,
  subtitle = "Pagan Sud Panam",
  className,
}: DateSelectorProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(
    initialDate || new Date(),
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

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

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      handleDateChange(date);
      setIsCalendarOpen(false);
    }
  };

  const formatDate = (date: Date) => {
    return format(date, "EEEE, dd MMM yyyy");
  };

  return (
    <Card
      className={cn(
        "glass border-0 shadow-modern card-hover",
        className,
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
              <Calendar className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto hover:bg-transparent text-left justify-start"
                  >
                    <div>
                      <h3 className="text-lg font-bold text-primary mb-1 hover:text-primary/80 transition-colors">
                        {formatDate(selectedDate)}
                      </h3>
                      <p className="body-small text-muted-foreground font-medium">
                        {subtitle}
                      </p>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 animate-scale-in" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleCalendarSelect}
                    initialFocus
                    className="rounded-md border"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-10 h-10 p-0 hover:bg-primary/10 rounded-xl transition-all duration-200 btn-hover"
              onClick={goToPreviousDay}
            >
              <ChevronLeft className="w-4 h-4 text-primary" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-10 h-10 p-0 hover:bg-primary/10 rounded-xl transition-all duration-200 btn-hover"
              onClick={goToNextDay}
            >
              <ChevronRight className="w-4 h-4 text-primary" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}