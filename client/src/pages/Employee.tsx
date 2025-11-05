import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, dateFnsLocalizer, View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BookingCompletionDialog } from "@/components/employee/BookingCompletionDialog";
import type { BookingWithDetails, Stylist } from "@shared/schema";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = {
  es: es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: es }),
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: BookingWithDetails;
}

export default function Employee() {
  const [selectedStylistId, setSelectedStylistId] = useState<string>("all");
  const [calendarView, setCalendarView] = useState<View>("month");
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch stylists
  const { data: stylists = [], isLoading: stylistsLoading } = useQuery<Stylist[]>({
    queryKey: ["/api/admin/stylists"],
  });

  // Fetch bookings
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<BookingWithDetails[]>({
    queryKey: ["/api/admin/bookings"],
  });

  // Filter bookings by selected stylist
  const filteredBookings = selectedStylistId === "all" 
    ? bookings 
    : bookings.filter(b => b.stylistId === selectedStylistId);

  // Convert bookings to calendar events
  const events: CalendarEvent[] = filteredBookings.map((booking) => {
    const appointmentDate = new Date(booking.appointmentDate);
    const [hours, minutes] = booking.appointmentTime.split(':');
    const startTime = new Date(appointmentDate);
    startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Parse duration and calculate end time
    const durationMatch = booking.service.duration.match(/(\d+)/);
    const durationMinutes = durationMatch ? parseInt(durationMatch[1]) : 60;
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + durationMinutes);

    return {
      id: booking.id,
      title: `${booking.service.name} - ${booking.client.name}`,
      start: startTime,
      end: endTime,
      resource: booking,
    };
  });

  const eventStyleGetter = (event: CalendarEvent) => {
    const booking = event.resource;
    let backgroundColor = "#D4AF37"; // Gold default
    
    switch (booking.status) {
      case "done":
        backgroundColor = "#22c55e"; // Green
        break;
      case "cancelled":
        backgroundColor = "#ef4444"; // Red
        break;
      case "in_progress":
        backgroundColor = "#3b82f6"; // Blue
        break;
      case "for_today":
        backgroundColor = "#f59e0b"; // Orange
        break;
      default:
        backgroundColor = "#D4AF37"; // Gold
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.9,
        color: "white",
        border: "0px",
        display: "block",
      },
    };
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "Playfair Display, serif" }}>
            Panel de Empleados
          </h1>
          <p className="text-muted-foreground">
            Visualiza y gestiona tus citas programadas
          </p>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="stylist-filter" data-testid="label-stylist-filter">
                Filtrar por Estilista
              </Label>
              <Select 
                value={selectedStylistId} 
                onValueChange={setSelectedStylistId}
              >
                <SelectTrigger id="stylist-filter" data-testid="select-stylist-filter">
                  <SelectValue placeholder="Seleccionar estilista" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Estilistas</SelectItem>
                  {stylists.map((stylist) => (
                    <SelectItem key={stylist.id} value={stylist.id}>
                      {stylist.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="view-filter" data-testid="label-view-filter">
                Vista del Calendario
              </Label>
              <Select 
                value={calendarView} 
                onValueChange={(value) => setCalendarView(value as View)}
              >
                <SelectTrigger id="view-filter" data-testid="select-view-filter">
                  <SelectValue placeholder="Seleccionar vista" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Mes</SelectItem>
                  <SelectItem value="week">Semana</SelectItem>
                  <SelectItem value="day">Día</SelectItem>
                  <SelectItem value="agenda">Agenda</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Calendar */}
        <Card className="p-6">
          {bookingsLoading || stylistsLoading ? (
            <div className="flex items-center justify-center h-[600px]">
              <p className="text-muted-foreground">Cargando calendario...</p>
            </div>
          ) : (
            <div style={{ height: "600px" }} data-testid="calendar-container">
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                view={calendarView}
                onView={setCalendarView}
                eventPropGetter={eventStyleGetter}
                onSelectEvent={(event) => {
                  setSelectedBooking(event.resource);
                  setDialogOpen(true);
                }}
                culture="es"
                messages={{
                  today: "Hoy",
                  previous: "Anterior",
                  next: "Siguiente",
                  month: "Mes",
                  week: "Semana",
                  day: "Día",
                  agenda: "Agenda",
                  date: "Fecha",
                  time: "Hora",
                  event: "Cita",
                  noEventsInRange: "No hay citas en este rango de fechas",
                  showMore: (total) => `+ Ver más (${total})`,
                }}
              />
            </div>
          )}
        </Card>

        {/* Legend */}
        <Card className="p-4 mt-6">
          <h3 className="font-semibold mb-3">Leyenda de Estados</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#D4AF37" }} />
              <span className="text-sm">Pendiente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#f59e0b" }} />
              <span className="text-sm">Para Hoy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#3b82f6" }} />
              <span className="text-sm">En Progreso</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#22c55e" }} />
              <span className="text-sm">Completada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#ef4444" }} />
              <span className="text-sm">Cancelada</span>
            </div>
          </div>
        </Card>

        <BookingCompletionDialog
          booking={selectedBooking}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      </div>
    </div>
  );
}
