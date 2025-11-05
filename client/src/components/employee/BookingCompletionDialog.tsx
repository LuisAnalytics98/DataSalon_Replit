import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { BookingWithDetails } from "@shared/schema";

const bookingCompletionFormSchema = z.object({
  status: z.enum(["in_progress", "done", "cancelled"]),
  finalPrice: z.string().optional(),
});

type BookingCompletionFormValues = z.infer<typeof bookingCompletionFormSchema>;

interface BookingCompletionDialogProps {
  booking: BookingWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingCompletionDialog({
  booking,
  open,
  onOpenChange,
}: BookingCompletionDialogProps) {
  const { toast } = useToast();

  const form = useForm<BookingCompletionFormValues>({
    resolver: zodResolver(bookingCompletionFormSchema),
    defaultValues: {
      status: booking?.status as "in_progress" | "done" | "cancelled" || "in_progress",
      finalPrice: booking?.finalPrice?.toString() || "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: BookingCompletionFormValues) => {
      const finalPriceNum = data.finalPrice && data.finalPrice !== "" 
        ? parseInt(data.finalPrice) 
        : undefined;

      const response = await fetch(`/api/admin/bookings/${booking?.id}/completion`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: data.status,
          finalPrice: finalPriceNum,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to update booking");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      toast({
        title: "Cita actualizada",
        description: "Los cambios se guardaron correctamente.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la cita.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BookingCompletionFormValues) => {
    updateMutation.mutate(data);
  };

  if (!booking) return null;

  const getCurrencySymbol = (currency: string) => {
    return currency === "dolares" ? "$" : "₡";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-booking-completion">
        <DialogHeader>
          <DialogTitle>Completar Servicio</DialogTitle>
          <DialogDescription>
            Actualiza el estado y precio final del servicio
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mb-4">
          <div>
            <div className="text-sm text-muted-foreground">Cliente</div>
            <div className="font-medium">{booking.client.name}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Servicio</div>
            <div className="font-medium">{booking.service.name}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Precio Estimado</div>
            <div className="font-medium">
              {getCurrencySymbol(booking.service.currency)}{booking.service.price}
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-booking-status">
                        <SelectValue placeholder="Selecciona el estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="in_progress">En Progreso</SelectItem>
                      <SelectItem value="done">Completado</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="finalPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio Final (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder={`Ej: ${booking.service.price}`}
                      {...field}
                      data-testid="input-final-price"
                    />
                  </FormControl>
                  <div className="text-xs text-muted-foreground">
                    Deja vacío para usar el precio estimado
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                data-testid="button-cancel-completion"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={updateMutation.isPending}
                data-testid="button-save-completion"
              >
                {updateMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
