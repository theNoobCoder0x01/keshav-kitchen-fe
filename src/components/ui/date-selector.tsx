"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { useState } from "react"
import { format, addDays, subDays } from "date-fns"
import { cn } from "@/lib/utils"

interface DateSelectorProps {
  date?: Date
  onDateChange?: (date: Date) => void
  subtitle?: string
  className?: string
}

export function DateSelector({
  date: initialDate,
  onDateChange,
  subtitle = "Pagan Sud Panam",
  className,
}: DateSelectorProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date())
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate)
    onDateChange?.(newDate)
  }

  const goToPreviousDay = () => {
    const newDate = subDays(selectedDate, 1)
    handleDateChange(newDate)
  }

  const goToNextDay = () => {
    const newDate = addDays(selectedDate, 1)
    handleDateChange(newDate)
  }

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      handleDateChange(date)
      setIsCalendarOpen(false)
    }
  }

  const formatDate = (date: Date) => {
    return format(date, "EEEE, dd MMM yyyy")
  }

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
                  <Button variant="ghost" className="p-0 h-auto hover:bg-transparent text-left justify-start">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#674af5] mb-1 hover:text-[#856ef7] transition-colors">
                        {formatDate(selectedDate)}
                      </h3>
                      <p className="text-sm text-[#4b465c]/70 font-medium">{subtitle}</p>
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
  )
}
