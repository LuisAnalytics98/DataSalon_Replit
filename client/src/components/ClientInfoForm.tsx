import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import salonHeroImage from "@assets/generated_images/Salon_interior_hero_image_fa71b9a1.png";

const clientInfoSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Por favor ingresa un correo electrónico válido"),
  phone: z.string().min(10, "Por favor ingresa un número de teléfono válido"),
  birthDate: z.date().optional(),
  notes: z.string().optional(),
});

export type ClientInfo = z.infer<typeof clientInfoSchema>;

interface ClientInfoFormProps {
  onSubmit: (data: ClientInfo) => void;
  initialData?: Partial<ClientInfo>;
}

export default function ClientInfoForm({ onSubmit, initialData }: ClientInfoFormProps) {
  const form = useForm<ClientInfo>({
    resolver: zodResolver(clientInfoSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      birthDate: initialData?.birthDate || undefined,
      notes: initialData?.notes || "",
    },
  });

  return (
    <div className="min-h-[calc(100vh-88px)]">
      <div className="relative h-[30vh] sm:h-[40vh] overflow-hidden">
        <img 
          src={salonHeroImage} 
          alt="Elegant salon interior" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60" />
        <div className="absolute inset-0 flex items-center justify-center text-center px-4">
          <div>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-3">
              Bienvenido a Nuestro Salón
            </h1>
            <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto">
              Comencemos con tu reserva
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-2">
            Cuéntanos sobre ti
          </h2>
          <p className="text-muted-foreground text-base">
            Usaremos esta información para confirmar tu cita
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Nombre Completo</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ingresa tu nombre completo" 
                      {...field} 
                      data-testid="input-name"
                      className="py-3"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Correo Electrónico</FormLabel>
                  <FormControl>
                    <Input 
                      type="email"
                      placeholder="tu.correo@ejemplo.com" 
                      {...field} 
                      data-testid="input-email"
                      className="py-3"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Número de Teléfono</FormLabel>
                  <FormControl>
                    <Input 
                      type="tel"
                      placeholder="(555) 123-4567" 
                      {...field} 
                      data-testid="input-phone"
                      className="py-3"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="birthDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-sm font-medium">Fecha de Nacimiento (Opcional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full py-3 pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          data-testid="button-birthdate-picker"
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: es })
                          ) : (
                            <span>Selecciona tu fecha de nacimiento</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        captionLayout="dropdown-buttons"
                        fromYear={1900}
                        toYear={new Date().getFullYear()}
                        defaultMonth={field.value || new Date(2000, 0)}
                        initialFocus
                        locale={es}
                        data-testid="calendar-birthdate"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Información Adicional (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Alergias, preferencias o solicitudes especiales..."
                      rows={4}
                      {...field} 
                      data-testid="input-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                size="lg"
                className="px-12"
                data-testid="button-continue"
              >
                Continuar a Servicios
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
