import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StylistAvailability } from "@shared/schema";

interface DateTimeSelectionProps {
  onContinue: (date: Date, time: string) => void;
  initialDate?: Date;
  initialTime?: string;
  stylistId?: string | null;
  salonSlug: string;
}

export default function DateTimeSelection({ onContinue, initialDate, initialTime, stylistId, salonSlug }: DateTimeSelectionProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate || null);
  const [selectedTime, setSelectedTime] = useState<string | null>(initialTime || null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Fetch stylist availability
  const { data: availability = [] } = useQuery<StylistAvailability[]>({
    queryKey: ["/api/public/stylists", stylistId, "availability"],
    enabled: !!stylistId && stylistId !== "any",
    queryFn: async () => {
      if (!stylistId || stylistId === "any") return [];
      const response = await fetch(`/api/public/stylists/${stylistId}/availability`);
      if (!response.ok) throw new Error("Failed to fetch availability");
      return await response.json();
    },
  });

  // Fetch booked slots and blocked ranges for the selected date
  const { data: bookedSlotsData } = useQuery<{ 
    availability: StylistAvailability[], 
    bookedSlots: string[],
    blockedRanges?: Array<{
      start: string;
      startMinutes: number;
      endMinutes: number;
      duration: number;
    }>
  }>({
    queryKey: ["/api/public/stylists", stylistId, "availability", selectedDate?.toISOString(), salonSlug],
    enabled: !!stylistId && stylistId !== "any" && !!selectedDate,
    queryFn: async () => {
      if (!stylistId || stylistId === "any" || !selectedDate) return { availability: [], bookedSlots: [], blockedRanges: [] };
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await fetch(`/api/public/stylists/${stylistId}/availability?date=${dateStr}&salonSlug=${salonSlug}`);
      if (!response.ok) throw new Error("Failed to fetch booked slots");
      return await response.json();
    },
  });

  const bookedSlots = bookedSlotsData?.bookedSlots || [];
  const blockedRanges = bookedSlotsData?.blockedRanges || [];

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
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

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

  // Check if a date has available slots based on stylist availability
  const isDateAvailable = (date: Date) => {
    if (!stylistId || stylistId === "any") return true; // Any stylist = all dates available
    if (availability.length === 0) return true; // No availability data = all dates available
    
    // Monday = 0 in our schema, Sunday = 6 
    // JavaScript's getDay(): Sunday = 0, Monday = 1, etc.
    const dayOfWeek = date.getDay() === 0 ? 6 : date.getDay() - 1; // Convert JS day to our schema day
    
    return availability.some(slot => slot.dayOfWeek === dayOfWeek);
  };

  // Get available time slots for the selected date
  const availableTimeSlots = useMemo(() => {
    if (!selectedDate || !stylistId || stylistId === "any") {
      return timeSlots; // All time slots available if no stylist or any stylist selected
    }
    
    if (availability.length === 0) {
      return timeSlots; // No availability data = all slots available
    }
    
    // Get the day of week for selected date (convert JS day to our schema day)
    const dayOfWeek = selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1;
    
    // Find availability slots for this day of week
    const daySlots = availability.filter(slot => slot.dayOfWeek === dayOfWeek);
    
    if (daySlots.length === 0) {
      return []; // No slots for this day
    }
    
    // Helper function to convert time slot string to minutes since midnight
    const timeToMinutes = (timeStr: string): number => {
      const [time, period] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      
      return hours * 60 + minutes;
    };
    
    // Helper function to convert 24-hour time to minutes since midnight
    const time24ToMinutes = (timeStr: string): number => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    // Filter time slots based on availability
    return timeSlots.filter(slot => {
      const slotMinutes = timeToMinutes(slot);
      
      return daySlots.some(availSlot => {
        const startMinutes = time24ToMinutes(availSlot.startTime);
        const endMinutes = time24ToMinutes(availSlot.endTime);
        
        return slotMinutes >= startMinutes && slotMinutes < endMinutes;
      });
    });
  }, [selectedDate, stylistId, availability, timeSlots]);

  // Helper function to convert time slot string to minutes since midnight
  // Handles both "9:00 AM" (12-hour) and "09:00" (24-hour) formats
  const timeSlotToMinutes = (timeSlot: string): number => {
    // Check if it's 24-hour format (HH:mm)
    if (timeSlot.includes(':') && !timeSlot.includes('AM') && !timeSlot.includes('PM')) {
      const [hours, minutes] = timeSlot.split(':').map(Number);
      return hours * 60 + minutes;
    }
    // Handle 12-hour format (9:00 AM)
    const [time, period] = timeSlot.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  // Check if a time slot is booked or overlaps with any blocked range
  const isTimeSlotBooked = (timeSlot: string) => {
    // First check for exact match (backward compatibility)
    if (bookedSlots.includes(timeSlot)) return true;
    
    // Check if time slot overlaps with any blocked range
    const slotStartMinutes = timeSlotToMinutes(timeSlot);
    const slotEndMinutes = slotStartMinutes + 30; // Each time slot is 30 minutes
    
    return blockedRanges.some((range) => {
      // Use the pre-calculated minutes from the backend, or calculate if not available
      const rangeStartMinutes = range.startMinutes ?? timeSlotToMinutes(range.start);
      const rangeEndMinutes = range.endMinutes ?? (rangeStartMinutes + (range.duration || 60));
      
      // Check if the time slot overlaps with the blocked range
      // Two ranges overlap if slotStart < rangeEnd AND rangeStart < slotEnd
      return slotStartMinutes < rangeEndMinutes && rangeStartMinutes < slotEndMinutes;
    });
  };

  // Clear selected time if it becomes booked
  useEffect(() => {
    if (selectedTime && isTimeSlotBooked(selectedTime)) {
      setSelectedTime(null);
    }
  }, [selectedTime, bookedSlots]);

  const handleContinue = () => {
    if (selectedDate && selectedTime) {
      // Final check: ensure selected time is not booked
      if (isTimeSlotBooked(selectedTime)) {
        setSelectedTime(null);
        return;
      }
      onContinue(selectedDate, selectedTime);
    }
  };

  return (
    <div className="min-h-[calc(100vh-88px)] py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 text-center">
          <h2 className="font-serif text-4xl sm:text-5xl font-semibold text-foreground mb-3">
            Selecciona Fecha y Hora
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Elige la fecha y hora preferidas para tu cita
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
              {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {days.map((day, index) => {
                const isDisabled = !day || isPastDate(day) || (day && !isDateAvailable(day));
                
                return (
                  <button
                    key={index}
                    disabled={isDisabled}
                    onClick={() => day && setSelectedDate(day)}
                    className={cn(
                      "aspect-square rounded-lg text-sm font-medium transition-all",
                      !day && "invisible",
                      day && !isDisabled && "hover-elevate cursor-pointer",
                      day && isDisabled && "text-muted-foreground/40 cursor-not-allowed",
                      day && !isDisabled && !isSameDay(day, selectedDate) && "bg-muted text-foreground",
                      isSameDay(day, selectedDate) && "bg-primary text-primary-foreground"
                    )}
                    data-testid={day ? `button-date-${day.getDate()}` : undefined}
                  >
                    {day?.getDate()}
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-serif text-2xl font-semibold text-foreground mb-6">
              Horarios Disponibles
            </h3>
            
            {!selectedDate ? (
              <div className="text-center py-12 text-muted-foreground">
                Por favor selecciona una fecha primero
              </div>
            ) : availableTimeSlots.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No hay horarios disponibles para esta fecha
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                {availableTimeSlots.map((time) => {
                  const isBooked = isTimeSlotBooked(time);
                  return (
                    <button
                      key={time}
                      onClick={() => !isBooked && setSelectedTime(time)}
                      disabled={isBooked}
                      className={cn(
                        "py-3 px-4 rounded-lg text-sm font-medium transition-all",
                        !isBooked && "hover-elevate cursor-pointer",
                        isBooked && "cursor-not-allowed opacity-40 text-muted-foreground line-through",
                        selectedTime === time && !isBooked
                          ? "bg-primary text-primary-foreground"
                          : !isBooked
                          ? "bg-muted text-foreground"
                          : "bg-muted/50"
                      )}
                      data-testid={`button-time-${time.replace(/\s/g, '-')}`}
                    >
                      {time}
                    </button>
                  );
                })}
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
            Continuar a Confirmación
          </Button>
        </div>
      </div>
    </div>
  );
}
