import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { BookingWithDetails } from "@shared/schema";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Clock, User, Scissors } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const COLUMN_STATUSES = [
  { id: "backlog", label: "Pendientes", color: "bg-gray-500" },
  { id: "for_today", label: "Para Hoy", color: "bg-blue-500" },
  { id: "in_progress", label: "En Progreso", color: "bg-yellow-500" },
  { id: "done", label: "Completadas", color: "bg-green-500" },
  { id: "cancelled", label: "Canceladas", color: "bg-red-500" },
] as const;

type BookingStatus = typeof COLUMN_STATUSES[number]["id"];

interface BookingCardProps {
  booking: BookingWithDetails;
  isDragging?: boolean;
  columnId?: BookingStatus;
}

function BookingCard({ booking, isDragging, columnId }: BookingCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ 
    id: booking.id,
    data: { columnId: columnId || booking.status }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="mb-2 cursor-move hover-elevate active-elevate-2"
      data-testid={`booking-card-${booking.id}`}
    >
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm" data-testid={`booking-reference-${booking.id}`}>
              {booking.bookingReference}
            </span>
            <Badge variant="outline" className="text-xs">
              {format(new Date(booking.appointmentDate), "MMM dd", { locale: es })}
            </Badge>
          </div>
          
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="w-3 h-3" />
              <span data-testid={`booking-client-${booking.id}`}>{booking.client.name}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Scissors className="w-3 h-3" />
              <span data-testid={`booking-service-${booking.id}`}>{booking.service.name}</span>
            </div>
            
            {booking.stylist && (
              <div className="flex items-center gap-2">
                <User className="w-3 h-3" />
                <span className="text-xs">{booking.stylist.name}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              <span data-testid={`booking-time-${booking.id}`}>{booking.appointmentTime}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface DroppableColumnProps {
  id: BookingStatus;
  label: string;
  color: string;
  bookings: BookingWithDetails[];
}

function DroppableColumn({ id, label, color, bookings }: DroppableColumnProps) {
  const { setNodeRef } = useDroppable({ 
    id,
    data: { columnId: id }
  });

  return (
    <Card className="flex flex-col h-full" data-testid={`column-${id}`} ref={setNodeRef}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${color}`} />
          {label}
          <Badge variant="secondary" className="ml-auto">
            {bookings.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        <ScrollArea className="h-[calc(100vh-300px)]">
          <SortableContext items={bookings.map(b => b.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2 pr-4">
              {bookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} columnId={id} />
              ))}
              {bookings.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">
                  No hay reservas
                </p>
              )}
            </div>
          </SortableContext>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default function KanbanBoard() {
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data: bookings = [], isLoading } = useQuery<BookingWithDetails[]>({
    queryKey: ["/api/bookings"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BookingStatus }) => {
      const response = await apiRequest("PATCH", `/api/admin/bookings/${id}/status`, { status });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const bookingId = active.id as string;
    const overIdStr = over.id as string;
    
    // Determine the target status from the over data
    const validStatuses = COLUMN_STATUSES.map(col => col.id);
    let newStatus: BookingStatus;
    
    // Check if over.data contains column information
    if (over.data.current?.columnId) {
      newStatus = over.data.current.columnId as BookingStatus;
    } else if (validStatuses.includes(overIdStr as BookingStatus)) {
      // Dropped on column directly (empty space)
      newStatus = overIdStr as BookingStatus;
    } else {
      // Unable to determine target column
      setActiveId(null);
      return;
    }

    const booking = bookings.find(b => b.id === bookingId);

    if (booking && booking.status !== newStatus) {
      updateStatusMutation.mutate({ id: bookingId, status: newStatus });
    }

    setActiveId(null);
  };

  const getBookingsByStatus = (status: BookingStatus) => {
    return bookings.filter(b => b.status === status);
  };

  const activeBooking = bookings.find(b => b.id === activeId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Cargando reservas...</p>
      </div>
    );
  }

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={closestCorners}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4" data-testid="kanban-board">
        {COLUMN_STATUSES.map((column) => {
          const columnBookings = getBookingsByStatus(column.id);
          
          return (
            <DroppableColumn
              key={column.id}
              id={column.id}
              label={column.label}
              color={column.color}
              bookings={columnBookings}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeBooking && <BookingCard booking={activeBooking} isDragging />}
      </DragOverlay>
    </DndContext>
  );
}
