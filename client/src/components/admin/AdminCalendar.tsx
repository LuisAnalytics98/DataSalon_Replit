import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Calendar, dateFnsLocalizer, View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { BookingWithDetails, Stylist, Service, UpdateBookingCompletion } from "@shared/schema";
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

export default function AdminCalendar() {
  const [selectedStylistId, setSelectedStylistId] = useState<string>("all");
  const [calendarView, setCalendarView] = useState<View>("month");
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const { toast } = useToast();

  // State for editing
  const [editStatus, setEditStatus] = useState<string>("");
  const [editFinalPrice, setEditFinalPrice] = useState<number>(0);

  // State for creating new appointment
  const [newAppointmentData, setNewAppointmentData] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    serviceId: "",
    stylistId: "",
    time: "",
  });

  // Fetch stylists
  const { data: stylists = [], isLoading: stylistsLoading } = useQuery<Stylist[]>({
    queryKey: ["/api/admin/stylists"],
  });

  // Fetch services
  const { data: services = [], isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ["/api/admin/services"],
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
    const durationMinutes = typeof booking.service.duration === 'number' 
      ? booking.service.duration 
      : 60;
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

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedBooking(event.resource);
    setEditStatus(event.resource.status);
    setEditFinalPrice(event.resource.finalPrice || 0);
    setDialogOpen(true);
  };

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    if (calendarView === "agenda") {
      setSelectedSlot(slotInfo);
      setNewAppointmentData({
        clientName: "",
        clientEmail: "",
        clientPhone: "",
        serviceId: "",
        stylistId: selectedStylistId !== "all" ? selectedStylistId : "",
        time: format(slotInfo.start, "HH:mm"),
      });
      setCreateDialogOpen(true);
    }
  };

  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateBookingCompletion }) => {
      const response = await apiRequest("PATCH", `/api/admin/bookings/${id}/completion`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      setDialogOpen(false);
      toast({
        title: "Cita actualizada",
        description: "La cita se ha actualizado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la cita.",
        variant: "destructive",
      });
    },
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/public/demo-salon/bookings`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      setCreateDialogOpen(false);
      setNewAppointmentData({
        clientName: "",
        clientEmail: "",
        clientPhone: "",
        serviceId: "",
        stylistId: "",
        time: "",
      });
      toast({
        title: "Cita creada",
        description: "La cita se ha creado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear la cita.",
        variant: "destructive",
      });
    },
  });

  const handleUpdateBooking = () => {
    if (!selectedBooking) return;

    const updateData: UpdateBookingCompletion = {
      status: editStatus as "in_progress" | "done" | "cancelled",
      finalPrice: editFinalPrice > 0 ? editFinalPrice : undefined,
    };

    updateBookingMutation.mutate({ id: selectedBooking.id, data: updateData });
  };

  const handleCreateAppointment = () => {
    if (!selectedSlot) return;

    const appointmentData = {
      clientInfo: {
        name: newAppointmentData.clientName,
        email: newAppointmentData.clientEmail,
        phone: newAppointmentData.clientPhone,
      },
      serviceId: newAppointmentData.serviceId,
      stylistId: newAppointmentData.stylistId || "any",
      date: format(selectedSlot.start, "yyyy-MM-dd"),
      time: newAppointmentData.time,
    };

    createAppointmentMutation.mutate(appointmentData);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="stylist-filter-admin" data-testid="label-stylist-filter-admin">
              Filtrar por Profesional
            </Label>
            <Select 
              value={selectedStylistId} 
              onValueChange={setSelectedStylistId}
            >
              <SelectTrigger id="stylist-filter-admin" data-testid="select-stylist-filter-admin">
                <SelectValue placeholder="Seleccionar profesional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Profesionales</SelectItem>
                {stylists.map((stylist) => (
                  <SelectItem key={stylist.id} value={stylist.id}>
                    {stylist.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="view-filter-admin" data-testid="label-view-filter-admin">
              Vista del Calendario
            </Label>
            <Select 
              value={calendarView} 
              onValueChange={(value) => setCalendarView(value as View)}
            >
              <SelectTrigger id="view-filter-admin" data-testid="select-view-filter-admin">
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
        {calendarView === "agenda" && (
          <p className="text-xs text-muted-foreground mt-4">
            Haz clic en un horario en la vista de agenda para crear una nueva cita
          </p>
        )}
      </Card>

      {/* Calendar */}
      <Card className="p-6">
        {bookingsLoading || stylistsLoading ? (
          <div className="flex items-center justify-center h-[600px]">
            <p className="text-muted-foreground">Cargando calendario...</p>
          </div>
        ) : (
          <div style={{ height: "600px" }} data-testid="admin-calendar-container">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              view={calendarView}
              onView={setCalendarView}
              eventPropGetter={eventStyleGetter}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable
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
      <Card className="p-4">
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

      {/* Edit Booking Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-testid="dialog-edit-booking">
          <DialogHeader>
            <DialogTitle>Editar Cita</DialogTitle>
            <DialogDescription>
              Actualiza el estado y precio final de la cita
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-semibold">{selectedBooking.client.name}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Servicio</p>
                <p className="font-semibold">{selectedBooking.service.name}</p>
              </div>

              <div>
                <Label htmlFor="edit-status">Estado</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger id="edit-status" data-testid="select-edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="backlog">Pendiente</SelectItem>
                    <SelectItem value="for_today">Para Hoy</SelectItem>
                    <SelectItem value="in_progress">En Progreso</SelectItem>
                    <SelectItem value="done">Completada</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-price">Precio Final (opcional)</Label>
                <Input
                  id="edit-price"
                  data-testid="input-edit-price"
                  type="number"
                  value={editFinalPrice || ""}
                  onChange={(e) => setEditFinalPrice(parseInt(e.target.value) || 0)}
                  placeholder={`Precio base: ${selectedBooking.service.price}`}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateBooking} data-testid="button-save-booking">
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Appointment Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent data-testid="dialog-create-appointment">
          <DialogHeader>
            <DialogTitle>Nueva Cita</DialogTitle>
            <DialogDescription>
              Crea una nueva cita para {selectedSlot && format(selectedSlot.start, "dd/MM/yyyy", { locale: es })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="client-name">Nombre del Cliente</Label>
              <Input
                id="client-name"
                data-testid="input-client-name"
                value={newAppointmentData.clientName}
                onChange={(e) => setNewAppointmentData({ ...newAppointmentData, clientName: e.target.value })}
                placeholder="Juan Pérez"
                required
              />
            </div>

            <div>
              <Label htmlFor="client-email">Email</Label>
              <Input
                id="client-email"
                data-testid="input-client-email"
                type="email"
                value={newAppointmentData.clientEmail}
                onChange={(e) => setNewAppointmentData({ ...newAppointmentData, clientEmail: e.target.value })}
                placeholder="juan@example.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="client-phone">Teléfono</Label>
              <Input
                id="client-phone"
                data-testid="input-client-phone"
                type="tel"
                value={newAppointmentData.clientPhone}
                onChange={(e) => setNewAppointmentData({ ...newAppointmentData, clientPhone: e.target.value })}
                placeholder="+506 8888 8888"
                required
              />
            </div>

            <div>
              <Label htmlFor="service-select">Servicio</Label>
              <Select 
                value={newAppointmentData.serviceId} 
                onValueChange={(value) => setNewAppointmentData({ ...newAppointmentData, serviceId: value })}
              >
                <SelectTrigger id="service-select" data-testid="select-service">
                  <SelectValue placeholder="Seleccionar servicio" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} - {service.duration} min
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="stylist-select">Profesional</Label>
              <Select 
                value={newAppointmentData.stylistId} 
                onValueChange={(value) => setNewAppointmentData({ ...newAppointmentData, stylistId: value })}
              >
                <SelectTrigger id="stylist-select" data-testid="select-stylist">
                  <SelectValue placeholder="Seleccionar profesional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Cualquier disponible</SelectItem>
                  {stylists.map((stylist) => (
                    <SelectItem key={stylist.id} value={stylist.id}>
                      {stylist.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="appointment-time">Hora</Label>
              <Input
                id="appointment-time"
                data-testid="input-appointment-time"
                type="time"
                value={newAppointmentData.time}
                onChange={(e) => setNewAppointmentData({ ...newAppointmentData, time: e.target.value })}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateAppointment} 
              data-testid="button-create-appointment"
              disabled={!newAppointmentData.clientName || !newAppointmentData.clientEmail || !newAppointmentData.serviceId || !newAppointmentData.time}
            >
              Crear Cita
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
