import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateTimeSelectionProps {
  onContinue: (date: Date, time: string) => void;
  initialDate?: Date;
  initialTime?: string;
}

export default function DateTimeSelection({ onContinue, initialDate, initialTime }: DateTimeSelectionProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate || null);
  const [selectedTime, setSelectedTime] = useState<string | null>(initialTime || null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const timeSlots = [
    "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM",
    "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM"
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const isSameDay = (date1: Date | null, date2: Date | null) => {
    if (!date1 || !date2) return false;
    return date1.toDateString() === date2.toDateString();
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleContinue = () => {
    if (selectedDate && selectedTime) {
      onContinue(selectedDate, selectedTime);
    }
  };

  return (
    <div className="min-h-[calc(100vh-88px)] py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 text-center">
          <h2 className="font-serif text-4xl sm:text-5xl font-semibold text-foreground mb-3">
            Select Date & Time
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose your preferred appointment date and time
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-2xl font-semibold text-foreground">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrevMonth}
                  data-testid="button-prev-month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextMonth}
                  data-testid="button-next-month"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {days.map((day, index) => (
                <button
                  key={index}
                  disabled={!day || isPastDate(day)}
                  onClick={() => day && setSelectedDate(day)}
                  className={cn(
                    "aspect-square rounded-lg text-sm font-medium transition-all",
                    !day && "invisible",
                    day && !isPastDate(day) && "hover-elevate cursor-pointer",
                    day && isPastDate(day) && "text-muted-foreground/40 cursor-not-allowed",
                    day && !isPastDate(day) && !isSameDay(day, selectedDate) && "bg-muted text-foreground",
                    isSameDay(day, selectedDate) && "bg-primary text-primary-foreground"
                  )}
                  data-testid={day ? `button-date-${day.getDate()}` : undefined}
                >
                  {day?.getDate()}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-serif text-2xl font-semibold text-foreground mb-6">
              Available Times
            </h3>
            
            {!selectedDate ? (
              <div className="text-center py-12 text-muted-foreground">
                Please select a date first
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={cn(
                      "py-3 px-4 rounded-lg text-sm font-medium transition-all hover-elevate",
                      selectedTime === time
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    )}
                    data-testid={`button-time-${time.replace(/\s/g, '-')}`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="flex justify-end">
          <Button
            size="lg"
            onClick={handleContinue}
            disabled={!selectedDate || !selectedTime}
            className="px-12"
            data-testid="button-continue-datetime"
          >
            Continue to Confirmation
          </Button>
        </div>
      </div>
    </div>
  );
}
