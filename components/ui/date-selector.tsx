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

interface DateSelectorProps {
  date?: Date;
  onDateChange?: (date: Date) => void;
  subtitle?: string;
  className?: string;
  kitchenId?: string;
}

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  uid: string;
}

export function DateSelector({
  date: initialDate,
  onDateChange,
  subtitle,
  className,
  kitchenId,
}: DateSelectorProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(
    initialDate || new Date(),
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [currentEventInfo, setCurrentEventInfo] = useState<{
    tithi?: string;
    eventSummary?: string;
  }>({});

  // Fetch calendar events for the selected date
  useEffect(() => {
    const fetchCalendarEvents = async () => {
      try {
        const dateStr = selectedDate.toISOString().split("T")[0];
        const params = new URLSearchParams({
          date: dateStr,
          ...(kitchenId && { kitchenId }),
        });

        const response = await fetch(`/api/calendar/events?${params}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.events.length > 0) {
            // Extract tithi from event summaries
            const tithi = extractTithi(data.events);
            const eventSummary = getEventSummary(data.events);

            setCurrentEventInfo({
              tithi,
              eventSummary,
            });
          } else {
            setCurrentEventInfo({});
          }
        } else {
          setCurrentEventInfo({});
        }
      } catch (error) {
        console.error("Error fetching calendar events:", error);
        setCurrentEventInfo({});
      }
    };

    fetchCalendarEvents();
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

  // Extract tithi information from calendar events
  const extractTithi = (events: CalendarEvent[]): string | undefined => {
    for (const event of events) {
      const text = `${event.summary} ${event.description || ""}`.toLowerCase();

      // Common Gujarati tithi patterns
      const tithiPatterns = [
        /(sud|shukla|waxing)\s+(panam|paksha|fortnight)/i,
        /(vad|krishna|waning)\s+(panam|paksha|fortnight)/i,
        /(purnima|full moon)/i,
        /(amavasya|new moon)/i,
        /(ekadashi|ekadasi)/i,
        /(chaturdashi|chaturdasi)/i,
        /(ashtami|ashtmi)/i,
        /(navami|navmi)/i,
        /(dashami|dashmi)/i,
        /(trayodashi|trayodasi)/i,
        /(dwadashi|dwadasi)/i,
        /(saptami|saptmi)/i,
        /(shashthi|shashthi)/i,
        /(panchami|panchmi)/i,
        /(chaturthi|chaturthi)/i,
        /(tritiya|tritya)/i,
        /(dwitiya|dwitya)/i,
        /(pratipada|pratipad)/i,
        /(bij|trij|choth|panchmi|chhath|saptami|ashtami|navami|dashami|gyaras|baras|teras|chaudas|purnima)/i,
      ];

      for (const pattern of tithiPatterns) {
        const match = text.match(pattern);
        if (match) {
          return match[0];
        }
      }
    }

    return undefined;
  };

  // Get a formatted summary of events
  const getEventSummary = (events: CalendarEvent[]): string => {
    if (events.length === 0) return "";

    if (events.length === 1) {
      return events[0].summary;
    }

    // For multiple events, create a summary
    const summaries = events.map((event) => event.summary);
    return summaries.join(", ");
  };

  // Determine what to show as subtitle
  const getSubtitle = () => {
    if (currentEventInfo.tithi) {
      return currentEventInfo.tithi;
    }
    if (currentEventInfo.eventSummary) {
      return currentEventInfo.eventSummary;
    }
    return subtitle || "Pagan Sud Panam"; // Fallback to default or provided subtitle
  };

  return (
    <Card
      className={cn(
        "bg-white/80 backdrop-blur-sm border-[#dbdade]/50 hover:shadow-lg transition-all duration-300",
        className,
      )}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#674af5] to-[#856ef7] rounded-xl flex items-center justify-center shadow-lg">
              <Calendar className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="p-0 h-auto hover:bg-transparent text-left justify-start"
                  >
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#674af5] mb-1 hover:text-[#856ef7] transition-colors">
                        {formatDate(selectedDate)}
                      </h3>
                      <p className="text-sm text-[#4b465c]/70 font-medium">
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
              className="w-8 h-8 p-0 hover:bg-[#674af5]/10 rounded-lg transition-colors"
              onClick={goToPreviousDay}
            >
              <ChevronLeft className="w-4 h-4 text-[#674af5]" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 hover:bg-[#674af5]/10 rounded-lg transition-colors"
              onClick={goToNextDay}
            >
              <ChevronRight className="w-4 h-4 text-[#674af5]" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
