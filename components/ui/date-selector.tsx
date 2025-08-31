"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import api from "@/lib/api/axios";
import { cn } from "@/lib/utils";
import {
  addTime,
  formatForStorage,
  getLocalTimezone,
  subtractTime,
} from "@/lib/utils/date";
import { formatInTimeZone } from "date-fns-tz";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { DatePicker } from "./date-picker";

interface DateSelectorProps {
  date?: Date; // UTC Date for storage
  onDateChange?: (date: Date) => void; // Returns UTC Date for storage
  subtitle?: string;
  className?: string;
  kitchenId?: string;
  timezone?: string; // IANA timezone for display (defaults to user's local)
}

export function DateSelector({
  date: initialDate,
  onDateChange,
  subtitle,
  className,
  kitchenId,
  timezone,
}: DateSelectorProps) {
  const userTimezone = timezone || getLocalTimezone();
  const [selectedDate, setSelectedDate] = useState<Date>(
    initialDate || new Date() // Store in UTC
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
        const dateStr = formatForStorage(selectedDate).split("T")[0];
        const params = new URLSearchParams({
          date: dateStr,
          ...(kitchenId && { kitchenId }),
        });

        const response = await api.get(`/calendar/tithi?${params}`);
        const data = await response.data;

        if (response.status.toString().startsWith("2") && data.success) {
          setCurrentEventInfo({
            tithi: data.data.tithi,
            eventSummary: data.data.eventSummary,
          });
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
    const newDate = subtractTime.days(selectedDate, 1);
    handleDateChange(newDate);
  };

  const goToNextDay = () => {
    const newDate = addTime.days(selectedDate, 1);
    handleDateChange(newDate);
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      handleDateChange(date);
      setIsCalendarOpen(false);
    }
  };

  const formatDate = (date: Date) => {
    return formatInTimeZone(date, userTimezone, "EEEE, dd MMM yyyy");
  };

  const formatDay = (date: Date) => {
    return formatInTimeZone(date, userTimezone, "EEEE");
  };

  // Determine what to show as subtitle
  const getSubtitle = () => {
    if (currentEventInfo.eventSummary) {
      return currentEventInfo.eventSummary;
    }
    return formatDay(selectedDate);
  };

  return (
    <Card
      className={cn(
        "bg-card/80 backdrop-blur-xs border-border/50 hover:shadow-lg transition-all duration-300",
        className
      )}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-linear-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg">
              <Calendar className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
            </div>
            <div>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto hover:bg-transparent text-left justify-start"
                  >
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-primary mb-1 hover:text-primary/80 transition-colors">
                        {formatDate(selectedDate)}
                      </h3>
                      <p className="text-sm text-muted-foreground font-medium">
                        {getSubtitle()}
                      </p>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <DatePicker
                    value={selectedDate.getTime()}
                    onChangeDate={handleCalendarSelect}
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
              className="w-8 h-8 p-0 hover:bg-primary/10 rounded-lg transition-colors"
              onClick={goToPreviousDay}
            >
              <ChevronLeft className="w-4 h-4 text-primary" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 hover:bg-primary/10 rounded-lg transition-colors"
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
