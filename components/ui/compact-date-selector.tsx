"use client";

import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { addDays, format, subDays } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

interface CompactDateSelectorProps {
  date?: Date;
  onDateChange?: (date: Date) => void;
  className?: string;
  kitchenId?: string;
}

export function CompactDateSelector({
  date: initialDate,
  onDateChange,
  className,
  kitchenId,
}: CompactDateSelectorProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(
    initialDate || new Date(),
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [currentEventInfo, setCurrentEventInfo] = useState<{
    tithi?: string;
    eventSummary?: string;
  }>({});

  // Fetch tithi information for the selected date
  useEffect(() => {
    const fetchTithiInfo = async () => {
      try {
        const dateStr = selectedDate.toISOString().split("T")[0];
        const params = new URLSearchParams({
          date: dateStr,
          ...(kitchenId && { kitchenId }),
        });

        const response = await fetch(`/api/calendar/tithi?${params}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setCurrentEventInfo({
              tithi: data.tithi,
              eventSummary: data.eventSummary,
            });
          } else {
            setCurrentEventInfo({});
          }
        } else {
          setCurrentEventInfo({});
        }
      } catch (error) {
        console.error("Error fetching tithi information:", error);
        setCurrentEventInfo({});
      }
    };

    fetchTithiInfo();
  }, [selectedDate, kitchenId]);

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

  const formatShortDate = (date: Date) => {
    return format(date, "dd MMM");
  };

  const formatDay = (date: Date) => {
    return format(date, "EEEE");
  };

  // Determine what to show as subtitle
  const getSubtitle = () => {
    if (currentEventInfo.tithi) {
      return currentEventInfo.tithi;
    }
    if (currentEventInfo.eventSummary) {
      return currentEventInfo.eventSummary;
    }
    return formatDay(selectedDate);
  };

  return (
    <Card
      className={cn(
        "bg-card/80 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all duration-300",
        className,
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-md">
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto hover:bg-transparent text-left justify-start"
                  >
                    <div>
                      <h3 className="text-sm font-bold text-primary mb-0.5 hover:text-primary/80 transition-colors">
                        {formatShortDate(selectedDate)}
                      </h3>
                      <p className="text-xs text-muted-foreground font-medium">
                        {getSubtitle()}
                      </p>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
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
              className="w-7 h-7 p-0 hover:bg-primary/10 rounded-md transition-colors"
              onClick={goToPreviousDay}
            >
              <ChevronLeft className="w-3 h-3 text-primary" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-7 h-7 p-0 hover:bg-primary/10 rounded-md transition-colors"
              onClick={goToNextDay}
            >
              <ChevronRight className="w-3 h-3 text-primary" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}