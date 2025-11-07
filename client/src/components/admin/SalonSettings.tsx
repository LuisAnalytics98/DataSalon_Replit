import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Salon } from "@shared/schema";
import { Phone, Mail, MapPin, Facebook, Instagram, MessageCircle } from "lucide-react";

export default function SalonSettings() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    phone: "",
    email: "",
    location: "",
    whatsappNumber: "",
    instagramUrl: "",
    facebookUrl: "",
  });

  const { data: salonData, isLoading } = useQuery<{ salon: Salon; role: string }>({
    queryKey: ["/api/admin/salon"],
    onSuccess: (data) => {
      setFormData({
        name: data.salon.name || "",
        description: data.salon.description || "",
        phone: data.salon.phone || "",
        email: data.salon.email || "",
        location: data.salon.location || "",
        whatsappNumber: data.salon.whatsappNumber || "",
        instagramUrl: data.salon.instagramUrl || "",
        facebookUrl: data.salon.facebookUrl || "",
      });
    },
  });

  const updateSalonMutation = useMutation({
    mutationFn: async (data: Partial<Salon>) => {
      const response = await apiRequest("PATCH", `/api/admin/salon`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/salon"] });
      toast({
        title: "Configuración actualizada",
        description: "La información del salón se ha actualizado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la información del salón.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSalonMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="salon-settings">
      <div>
        <h2 className="text-2xl font-bold">Configuración del Salón</h2>
        <p className="text-muted-foreground">
          Administra la información de contacto y redes sociales de tu salón
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
              <CardDescription>
                Detalles principales del salón
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="salon-name">Nombre del Salón</Label>
                <Input
                  id="salon-name"
                  data-testid="input-salon-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Mi Salón de Belleza"
                  required
                />
              </div>

              <div>
                <Label htmlFor="salon-description">Descripción</Label>
                <Textarea
                  id="salon-description"
                  data-testid="input-salon-description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Salón de belleza premium..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="salon-location">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Ubicación
                </Label>
                <Input
                  id="salon-location"
                  data-testid="input-salon-location"
                  value={formData.location || ""}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Av. Principal 123, San José"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Información de Contacto</CardTitle>
              <CardDescription>
                Canales de comunicación con clientes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="salon-phone">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Teléfono
                </Label>
                <Input
                  id="salon-phone"
                  data-testid="input-salon-phone"
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+506 8888 8888"
                />
              </div>

              <div>
                <Label htmlFor="salon-email">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </Label>
                <Input
                  id="salon-email"
                  data-testid="input-salon-email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contacto@salon.com"
                />
              </div>

              <div>
                <Label htmlFor="salon-whatsapp">
                  <MessageCircle className="w-4 h-4 inline mr-2" />
                  WhatsApp
                </Label>
                <Input
                  id="salon-whatsapp"
                  data-testid="input-salon-whatsapp"
                  type="tel"
                  value={formData.whatsappNumber || ""}
                  onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                  placeholder="+506 8888 8888"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Número de WhatsApp para recibir comprobantes de reserva
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Redes Sociales</CardTitle>
              <CardDescription>
                Enlaces a tus perfiles en redes sociales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="salon-instagram">
                    <Instagram className="w-4 h-4 inline mr-2" />
                    Instagram
                  </Label>
                  <Input
                    id="salon-instagram"
                    data-testid="input-salon-instagram"
                    type="url"
                    value={formData.instagramUrl || ""}
                    onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                    placeholder="https://instagram.com/tu_salon"
                  />
                </div>

                <div>
                  <Label htmlFor="salon-facebook">
                    <Facebook className="w-4 h-4 inline mr-2" />
                    Facebook
                  </Label>
                  <Input
                    id="salon-facebook"
                    data-testid="input-salon-facebook"
                    type="url"
                    value={formData.facebookUrl || ""}
                    onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                    placeholder="https://facebook.com/tu_salon"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end mt-6">
          <Button
            type="submit"
            data-testid="button-save-salon-settings"
            disabled={updateSalonMutation.isPending}
          >
            {updateSalonMutation.isPending ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </form>
    </div>
  );
}
