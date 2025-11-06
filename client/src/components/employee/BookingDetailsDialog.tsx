import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BookingWithDetails } from "@shared/schema";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface BookingDetailsDialogProps {
  booking: BookingWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingDetailsDialog({
  booking,
  open,
  onOpenChange,
}: BookingDetailsDialogProps) {
  if (!booking) return null;

  const getCurrencySymbol = (currency: string) => {
    return currency === "dolares" ? "$" : "₡";
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "Pendiente",
      confirmed: "Confirmada",
      in_progress: "En Progreso",
      done: "Completado",
      cancelled: "Cancelado",
    };
    return statusMap[status] || status;
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "outline" => {
    if (status === "done") return "default";
    if (status === "cancelled") return "outline";
    return "secondary";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-booking-details">
        <DialogHeader>
          <DialogTitle>Detalles de la Cita</DialogTitle>
          <DialogDescription>
            Información completa del servicio
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="text-sm text-muted-foreground">Cliente</div>
            <div className="font-medium" data-testid="text-client-name">{booking.client.name}</div>
            {booking.client.email && (
              <div className="text-sm text-muted-foreground">{booking.client.email}</div>
            )}
            {booking.client.phone && (
              <div className="text-sm text-muted-foreground">{booking.client.phone}</div>
            )}
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Servicio</div>
            <div className="font-medium" data-testid="text-service-name">{booking.service.name}</div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Profesional</div>
            <div className="font-medium" data-testid="text-stylist-name">
              {booking.stylist ? booking.stylist.name : "No asignado"}
            </div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Fecha y Hora</div>
            <div className="font-medium" data-testid="text-booking-datetime">
              {format(new Date(booking.appointmentDate), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
              <br />
              {booking.appointmentTime}
            </div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Estado</div>
            <Badge variant={getStatusVariant(booking.status)} data-testid="badge-booking-status">
              {getStatusText(booking.status)}
            </Badge>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Precio Estimado</div>
            <div className="font-medium" data-testid="text-estimated-price">
              {getCurrencySymbol(booking.service.currency)}{booking.service.price}
            </div>
          </div>

          {booking.finalPrice && (
            <div>
              <div className="text-sm text-muted-foreground">Precio Final</div>
              <div className="font-medium text-lg" data-testid="text-final-price">
                {getCurrencySymbol(booking.service.currency)}{booking.finalPrice}
              </div>
            </div>
          )}

        </div>

        <div className="flex justify-end pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-close-details"
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
