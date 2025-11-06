import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Armchair, CheckCircle2, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const inquiryFormSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(8, "El teléfono debe tener al menos 8 dígitos"),
  salonName: z.string().min(2, "El nombre del salón debe tener al menos 2 caracteres"),
  message: z.string().optional(),
});

type InquiryFormValues = z.infer<typeof inquiryFormSchema>;

export default function Landing() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<InquiryFormValues>({
    resolver: zodResolver(inquiryFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      salonName: "",
      message: "",
    },
  });

  const inquiryMutation = useMutation({
    mutationFn: async (data: InquiryFormValues) => {
      const response = await fetch("/api/public/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to submit inquiry");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "¡Solicitud enviada!",
        description: "Nos pondremos en contacto contigo pronto.",
      });
      form.reset();
      setDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo enviar la solicitud. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InquiryFormValues) => {
    inquiryMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Armchair className="w-8 h-8 text-primary" />
            <span className="text-2xl font-serif font-bold">Data Salon</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#caracteristicas" className="text-sm hover:text-primary transition-colors" data-testid="link-features">
              Características
            </a>
            <a href="#precios" className="text-sm hover:text-primary transition-colors" data-testid="link-pricing">
              Precios
            </a>
            <a href="#acerca-de" className="text-sm hover:text-primary transition-colors" data-testid="link-about">
              Acerca de
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a href="/api/login?returnTo=/employee">
              <Button variant="ghost" size="sm" data-testid="button-employee-login">
                Panel Empleado
              </Button>
            </a>
            <a href="/api/login?returnTo=/admin">
              <Button variant="ghost" size="sm" data-testid="button-admin-login">
                Panel Admin
              </Button>
            </a>
            <Button 
              onClick={() => setDialogOpen(true)} 
              size="sm"
              data-testid="button-request-info"
            >
              Solicitar Información
            </Button>
          </div>
        </div>
      </header>

      <main className="pt-20">
        <section className="relative min-h-[600px] flex items-center">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background z-10" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDIxMiwgMTc1LCA1NSwgMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20" />
          
          <div className="container mx-auto px-4 relative z-20">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-6">
                <CheckCircle2 className="w-4 h-4" />
                Confiado por más de 500 Salones Premium
              </div>

              <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6">
                Eleva Tu Salón de{" "}
                <span className="text-primary">Belleza</span>
              </h1>

              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Transforma tu salón de belleza con nuestra plataforma de gestión premium. 
                Optimiza reservas, aumenta ingresos y ofrece experiencias excepcionales a tus clientes.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  onClick={() => setDialogOpen(true)}
                  data-testid="button-hero-request-info"
                >
                  Solicitar Información →
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => document.getElementById('caracteristicas')?.scrollIntoView({ behavior: 'smooth' })}
                  data-testid="button-hero-learn-more"
                >
                  Contactar Directamente
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-card/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6 rounded-lg bg-background border border-border" data-testid="card-stat-satisfaction">
                <div className="text-4xl font-bold text-primary mb-2">95%</div>
                <div className="text-sm text-muted-foreground">Satisfacción del Cliente</div>
              </div>
              <div className="text-center p-6 rounded-lg bg-background border border-border" data-testid="card-stat-revenue">
                <div className="text-4xl font-bold text-primary mb-2">40%</div>
                <div className="text-sm text-muted-foreground">Aumento de Ingresos</div>
              </div>
              <div className="text-center p-6 rounded-lg bg-background border border-border" data-testid="card-stat-availability">
                <div className="text-4xl font-bold text-primary mb-2">24/7</div>
                <div className="text-sm text-muted-foreground">Reservas Online</div>
              </div>
            </div>
          </div>
        </section>

        <section id="caracteristicas" className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-serif font-bold mb-4">Características Principales</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Todo lo que necesitas para gestionar tu salón de belleza de manera profesional
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="p-6 rounded-lg border border-border hover-elevate" data-testid="card-feature-bookings">
                <Clock className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Reservas Online 24/7</h3>
                <p className="text-muted-foreground text-sm">
                  Permite a tus clientes reservar citas en cualquier momento desde cualquier dispositivo.
                </p>
              </div>

              <div className="p-6 rounded-lg border border-border hover-elevate" data-testid="card-feature-calendar">
                <Users className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Gestión de Profesionales</h3>
                <p className="text-muted-foreground text-sm">
                  Administra horarios, servicios y disponibilidad de todo tu equipo en un solo lugar.
                </p>
              </div>

              <div className="p-6 rounded-lg border border-border hover-elevate" data-testid="card-feature-analytics">
                <CheckCircle2 className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Analíticas Avanzadas</h3>
                <p className="text-muted-foreground text-sm">
                  Visualiza métricas clave de tu negocio y toma decisiones informadas.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Data Salon. Todos los derechos reservados.</p>
        </div>
      </footer>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-testid="dialog-inquiry-form">
          <DialogHeader>
            <DialogTitle>Solicitar Información</DialogTitle>
            <DialogDescription>
              Completa el formulario y nos pondremos en contacto contigo pronto
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Tu nombre" {...field} data-testid="input-inquiry-name" />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="tu@email.com" {...field} data-testid="input-inquiry-email" />
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
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="8888-8888" {...field} data-testid="input-inquiry-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="salonName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Salón</FormLabel>
                    <FormControl>
                      <Input placeholder="Mi Salón de Belleza" {...field} data-testid="input-inquiry-salon-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mensaje (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Cuéntanos sobre tu salón..."
                        {...field}
                        data-testid="input-inquiry-message"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={inquiryMutation.isPending}
                data-testid="button-submit-inquiry"
              >
                {inquiryMutation.isPending ? "Enviando..." : "Enviar Solicitud"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
