import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Calendar, Clock, User, Mail, Phone, Scissors, Cake, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ClientInfo } from "./ClientInfoForm";
import type { Service, Stylist } from "@shared/schema";

interface BookingConfirmationProps {
  bookingId: string;
  clientInfo: ClientInfo;
  service: Service;
  stylist: Stylist | null;
  date: Date;
  time: string;
  onNewBooking: () => void;
  isLoading?: boolean;
}

export default function BookingConfirmation({
  bookingId,
  clientInfo,
  service,
  stylist,
  date,
  time,
  onNewBooking,
  isLoading = false,
}: BookingConfirmationProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-[calc(100vh-88px)] py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <CheckCircle2 className="w-12 h-12 text-primary" />
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground mb-3">
            ¡Reserva Confirmada!
          </h1>
          <p className="text-lg text-muted-foreground">
            Esperamos verte pronto
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Referencia de Reserva: <span className="font-semibold text-foreground">{bookingId}</span>
          </p>
        </div>

        <Card className="p-8 mb-6">
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-6 pb-4 border-b">
            Detalles de la Cita
          </h2>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                <Calendar className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Fecha y Hora</p>
                <p className="text-lg font-semibold text-foreground">{formatDate(date)}</p>
                <p className="text-base text-foreground">{time}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                <Scissors className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Servicio</p>
                <p className="text-lg font-semibold text-foreground">{service.name}</p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{service.duration} min</span>
                  </div>
                  <span>•</span>
                  <span className="font-semibold text-foreground">
                    {service.currency === "dolares" ? "$" : "₡"}{service.price}
                  </span>
                </div>
              </div>
            </div>

            {stylist && (
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  {stylist.imageUrl ? (
                    <img
                      src={stylist.imageUrl}
                      alt={stylist.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                      <User className="w-5 h-5 text-accent-foreground" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Profesional</p>
                  <p className="text-lg font-semibold text-foreground">{stylist.name}</p>
                  <p className="text-sm text-muted-foreground">{stylist.experience} de experiencia</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {service.reservationAmount && service.reservationAmount > 0 && (
          <Card className="p-6 mb-6 border-primary bg-primary/5">
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
              <h3 className="font-semibold text-lg">Importante: Reserva Requerida</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Para confirmar tu cita, por favor envía el comprobante de pago al WhatsApp del salón con el monto de reserva. De otro modo, tu cita será cancelada.
            </p>
            <div className="bg-background p-4 rounded-md">
              <p className="text-sm text-muted-foreground mb-1">Monto de Reserva:</p>
              <p className="text-2xl font-bold text-primary">
                {service.currency === "dolares" ? "$" : "₡"}{service.reservationAmount}
              </p>
            </div>
          </Card>
        )}

        <Card className="p-8 mb-8">
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-6 pb-4 border-b">
            Información del Cliente
          </h2>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                <User className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Nombre</p>
                <p className="text-base text-foreground">{clientInfo.name}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                <Mail className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Correo</p>
                <p className="text-base text-foreground">{clientInfo.email}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                <Phone className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Teléfono</p>
                <p className="text-base text-foreground">{clientInfo.phone}</p>
              </div>
            </div>

            {clientInfo.birthDate && (
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                  <Cake className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Fecha de Nacimiento</p>
                  <p className="text-base text-foreground" data-testid="text-birthdate">
                    {format(clientInfo.birthDate, "PPP", { locale: es })}
                  </p>
                </div>
              </div>
            )}

            {clientInfo.notes && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground mb-2">Notas Adicionales</p>
                <p className="text-base text-foreground">{clientInfo.notes}</p>
              </div>
            )}
          </div>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            size="lg"
            className="px-8"
            onClick={() => window.print()}
            data-testid="button-print"
          >
            Imprimir Confirmación
          </Button>
          <Button
            size="lg"
            className="px-8"
            onClick={onNewBooking}
            data-testid="button-new-booking"
          >
            Reservar Otra Cita
          </Button>
        </div>
      </div>
    </div>
  );
}
