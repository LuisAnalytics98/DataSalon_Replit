import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Service, InsertService } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Clock, DollarSign, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ServicesManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<InsertService>({
    id: "",
    name: "",
    description: "",
    duration: "",
    price: 0,
    photo: "",
  });
  const { toast } = useToast();

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const createMutation = useMutation({
    mutationFn: async (service: InsertService) => {
      const response = await apiRequest("POST", "/api/admin/services", service);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
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

  const resetForm = () => {
    setFormData({
      id: "",
      name: "",
      description: "",
      duration: "",
      price: 0,
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
      name: service.name,
      description: service.description,
      duration: service.duration,
      price: service.price,
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
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="service-duration">Duración</Label>
                    <Input
                      id="service-duration"
                      data-testid="input-service-duration"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      placeholder="ej: 60 min"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="service-price">Precio ($)</Label>
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
            {service.photo && (
              <div className="w-full h-48 overflow-hidden bg-muted">
                <img
                  src={service.photo}
                  alt={service.name}
                  className="w-full h-full object-cover"
                  data-testid={`service-photo-${service.id}`}
                />
              </div>
            )}
            {!service.photo && (
              <div className="w-full h-48 bg-muted flex items-center justify-center">
                <Image className="w-12 h-12 text-muted-foreground" />
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
                  <span>{service.duration}</span>
                </div>
                <div className="flex items-center gap-1 font-semibold text-primary">
                  <DollarSign className="w-4 h-4" />
                  <span>{service.price}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
