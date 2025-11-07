import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Service, InsertService } from "@shared/schema";
import type { UploadResult } from "@uppy/core";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Clock, DollarSign, Image, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";

export default function ServicesManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<InsertService>({
    id: "",
    salonId: "",
    name: "",
    description: "",
    duration: 60,
    price: 0,
    currency: "colones",
    reservationAmount: 0,
    photo: "",
  });
  const { toast } = useToast();

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ["/api/admin/services"],
  });

  const createMutation = useMutation({
    mutationFn: async (service: InsertService) => {
      const response = await apiRequest("POST", "/api/admin/services", service);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Servicio creado",
        description: "El servicio se ha creado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el servicio.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertService> }) => {
      const response = await apiRequest("PATCH", `/api/admin/services/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Servicio actualizado",
        description: "El servicio se ha actualizado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el servicio.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/services/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
      toast({
        title: "Servicio eliminado",
        description: "El servicio se ha eliminado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el servicio.",
        variant: "destructive",
      });
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: async ({ id, imageUrl }: { id: string; imageUrl: string }) => {
      const response = await apiRequest("PUT", `/api/admin/services/${id}/image`, { imageUrl });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
      toast({
        title: "Imagen cargada",
        description: "La imagen del servicio se ha cargado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo cargar la imagen.",
        variant: "destructive",
      });
    },
  });

  const handleGetUploadParameters = async () => {
    const response = await fetch("/api/objects/upload", {
      method: "POST",
      credentials: "include",
    });
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleUploadComplete = (serviceId: string) => (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      if (uploadedFile.uploadURL) {
        uploadImageMutation.mutate({ id: serviceId, imageUrl: uploadedFile.uploadURL });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      id: "",
      salonId: "",
      name: "",
      description: "",
      duration: 60,
      price: 0,
      currency: "colones",
      reservationAmount: 0,
      photo: "",
    });
    setEditingService(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingService) {
      updateMutation.mutate({ id: editingService.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      id: service.id,
      salonId: service.salonId,
      name: service.name,
      description: service.description,
      duration: service.duration,
      price: service.price,
      currency: service.currency || "colones",
      photo: service.photo || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este servicio?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Cargando servicios...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="services-management">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Servicios</h2>
          <p className="text-muted-foreground">Administra los servicios del salón</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-service">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Servicio
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-service-form">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingService ? "Editar Servicio" : "Nuevo Servicio"}
                </DialogTitle>
                <DialogDescription>
                  {editingService ? "Modifica los detalles del servicio" : "Agrega un nuevo servicio al salón"}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="service-id">ID del Servicio</Label>
                  <Input
                    id="service-id"
                    data-testid="input-service-id"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    placeholder="ej: facial-treatment"
                    required
                    disabled={!!editingService}
                  />
                </div>
                
                <div>
                  <Label htmlFor="service-name">Nombre</Label>
                  <Input
                    id="service-name"
                    data-testid="input-service-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ej: Tratamiento Facial"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="service-description">Descripción</Label>
                  <Textarea
                    id="service-description"
                    data-testid="input-service-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción del servicio..."
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="service-photo">Foto (URL)</Label>
                  <Input
                    id="service-photo"
                    data-testid="input-service-photo"
                    value={formData.photo || ""}
                    onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                    placeholder="https://ejemplo.com/foto.jpg"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Ingresa la URL de una foto para el servicio
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="service-duration">Duración</Label>
                  <Select
                    value={formData.duration?.toString() || "60"}
                    onValueChange={(value) => setFormData({ ...formData, duration: parseInt(value) })}
                  >
                    <SelectTrigger id="service-duration" data-testid="select-service-duration">
                      <SelectValue placeholder="Seleccionar duración" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="60">60 minutos</SelectItem>
                      <SelectItem value="90">90 minutos</SelectItem>
                      <SelectItem value="120">120 minutos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="service-price">Precio Aproximado</Label>
                    <Input
                      id="service-price"
                      data-testid="input-service-price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                      placeholder="ej: 75"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="service-currency">Moneda</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => setFormData({ ...formData, currency: value })}
                    >
                      <SelectTrigger id="service-currency" data-testid="select-service-currency">
                        <SelectValue placeholder="Selecciona moneda" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dolares">Dólares ($)</SelectItem>
                        <SelectItem value="colones">Colones (₡)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="service-reservation">Monto de Reserva (opcional)</Label>
                  <Input
                    id="service-reservation"
                    data-testid="input-service-reservation"
                    type="number"
                    value={formData.reservationAmount || 0}
                    onChange={(e) => setFormData({ ...formData, reservationAmount: parseInt(e.target.value) || 0 })}
                    placeholder="ej: 5000"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Monto que el cliente debe enviar para reservar la cita
                  </p>
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" data-testid="button-submit-service">
                  {editingService ? "Actualizar" : "Crear"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <Card key={service.id} className="hover-elevate overflow-hidden" data-testid={`service-card-${service.id}`}>
            {(service.imageUrl || service.photo) && (
              <div className="w-full h-48 overflow-hidden bg-muted relative">
                <img
                  src={service.imageUrl || service.photo || ""}
                  alt={service.name}
                  className="w-full h-full object-cover"
                  data-testid={`service-photo-${service.id}`}
                />
                <div className="absolute bottom-2 right-2">
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={10485760}
                    onGetUploadParameters={handleGetUploadParameters}
                    onComplete={handleUploadComplete(service.id)}
                    buttonClassName="h-8"
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    <span className="text-xs">Cambiar</span>
                  </ObjectUploader>
                </div>
              </div>
            )}
            {!service.imageUrl && !service.photo && (
              <div className="w-full h-48 bg-muted flex items-center justify-center relative">
                <Image className="w-12 h-12 text-muted-foreground" />
                <div className="absolute bottom-2 right-2">
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={10485760}
                    onGetUploadParameters={handleGetUploadParameters}
                    onComplete={handleUploadComplete(service.id)}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Subir Imagen
                  </ObjectUploader>
                </div>
              </div>
            )}
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{service.name}</span>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(service)}
                    data-testid={`button-edit-service-${service.id}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(service.id)}
                    data-testid={`button-delete-service-${service.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>{service.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{service.duration} min</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Precio aprox.</p>
                  <div className="flex items-center gap-1 font-semibold text-primary">
                    <span>{service.currency === "dolares" ? "$" : "₡"}{service.price}</span>
                  </div>
                </div>
              </div>
              {service.reservationAmount && service.reservationAmount > 0 && (
                <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                  Reserva: {service.currency === "dolares" ? "$" : "₡"}{service.reservationAmount}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
