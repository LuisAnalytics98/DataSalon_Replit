import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Stylist, InsertStylist, StylistAvailability, InsertStylistAvailability, Service } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, Star, Briefcase, Calendar, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DAYS_OF_WEEK = [
  { value: 0, label: "Lunes" },
  { value: 1, label: "Martes" },
  { value: 2, label: "Miércoles" },
  { value: 3, label: "Jueves" },
  { value: 4, label: "Viernes" },
  { value: 5, label: "Sábado" },
  { value: 6, label: "Domingo" },
];

interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export default function StylistsManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAvailabilityDialogOpen, setIsAvailabilityDialogOpen] = useState(false);
  const [editingStylist, setEditingStylist] = useState<Stylist | null>(null);
  const [availabilityStylist, setAvailabilityStylist] = useState<Stylist | null>(null);
  const [formData, setFormData] = useState<InsertStylist>({
    id: "",
    name: "",
    experience: "",
    rating: 40,
    specialties: [],
  });
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const { toast } = useToast();

  const { data: stylists = [], isLoading } = useQuery<Stylist[]>({
    queryKey: ["/api/admin/stylists"],
  });

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/admin/services"],
  });

  const { data: stylistAvailability = [] } = useQuery<StylistAvailability[]>({
    queryKey: ["/api/public/stylists", availabilityStylist?.id, "availability"],
    enabled: !!availabilityStylist,
    queryFn: async () => {
      if (!availabilityStylist) return [];
      const response = await fetch(`/api/public/stylists/${availabilityStylist.id}/availability`);
      if (!response.ok) throw new Error("Failed to fetch availability");
      return await response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (stylist: InsertStylist) => {
      const response = await apiRequest("POST", "/api/admin/stylists", stylist);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stylists"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Estilista creado",
        description: "El estilista se ha creado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el estilista.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertStylist> }) => {
      const response = await apiRequest("PATCH", `/api/admin/stylists/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stylists"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Estilista actualizado",
        description: "El estilista se ha actualizado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estilista.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/stylists/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stylists"] });
      toast({
        title: "Estilista eliminado",
        description: "El estilista se ha eliminado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el estilista.",
        variant: "destructive",
      });
    },
  });

  const saveAvailabilityMutation = useMutation({
    mutationFn: async ({ stylistId, availability }: { stylistId: string; availability: InsertStylistAvailability[] }) => {
      const response = await apiRequest("POST", `/api/admin/stylists/${stylistId}/availability`, { availability });
      return await response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/public/stylists", variables.stylistId, "availability"] });
      setIsAvailabilityDialogOpen(false);
      toast({
        title: "Horarios actualizados",
        description: "Los horarios del estilista se han actualizado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudieron actualizar los horarios.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      id: "",
      name: "",
      experience: "",
      rating: 40,
      specialties: [],
    });
    setEditingStylist(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingStylist) {
      updateMutation.mutate({ id: editingStylist.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (stylist: Stylist) => {
    setEditingStylist(stylist);
    setFormData({
      id: stylist.id,
      name: stylist.name,
      experience: stylist.experience,
      rating: stylist.rating,
      specialties: stylist.specialties,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este estilista?")) {
      deleteMutation.mutate(id);
    }
  };

  const toggleService = (serviceName: string) => {
    const isSelected = formData.specialties.includes(serviceName);
    if (isSelected) {
      setFormData({
        ...formData,
        specialties: formData.specialties.filter(s => s !== serviceName),
      });
    } else {
      setFormData({
        ...formData,
        specialties: [...formData.specialties, serviceName],
      });
    }
  };

  const handleManageAvailability = (stylist: Stylist) => {
    setAvailabilityStylist(stylist);
    setIsAvailabilityDialogOpen(true);
  };

  const addAvailabilitySlot = () => {
    setAvailabilitySlots([
      ...availabilitySlots,
      { dayOfWeek: 0, startTime: "09:00", endTime: "17:00" },
    ]);
  };

  const updateAvailabilitySlot = (index: number, field: keyof AvailabilitySlot, value: number | string) => {
    const updated = [...availabilitySlots];
    updated[index] = { ...updated[index], [field]: value };
    setAvailabilitySlots(updated);
  };

  const removeAvailabilitySlot = (index: number) => {
    setAvailabilitySlots(availabilitySlots.filter((_, i) => i !== index));
  };

  const handleSaveAvailability = () => {
    if (!availabilityStylist) return;

    const availability: InsertStylistAvailability[] = availabilitySlots.map(slot => ({
      stylistId: availabilityStylist.id,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
    }));

    saveAvailabilityMutation.mutate({
      stylistId: availabilityStylist.id,
      availability,
    });
  };

  // Load availability slots when dialog opens
  const handleOpenAvailabilityDialog = (open: boolean) => {
    setIsAvailabilityDialogOpen(open);
    if (open && stylistAvailability) {
      setAvailabilitySlots(
        stylistAvailability.map(av => ({
          dayOfWeek: av.dayOfWeek,
          startTime: av.startTime,
          endTime: av.endTime,
        }))
      );
    } else if (!open) {
      setAvailabilitySlots([]);
      setAvailabilityStylist(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Cargando estilistas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="stylists-management">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Estilistas</h2>
          <p className="text-muted-foreground">Administra el equipo del salón</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-stylist">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Estilista
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-stylist-form">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingStylist ? "Editar Estilista" : "Nuevo Estilista"}
                </DialogTitle>
                <DialogDescription>
                  {editingStylist ? "Modifica los detalles del estilista" : "Agrega un nuevo estilista al equipo"}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="stylist-id">ID del Estilista</Label>
                  <Input
                    id="stylist-id"
                    data-testid="input-stylist-id"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    placeholder="ej: maria-garcia"
                    required
                    disabled={!!editingStylist}
                  />
                </div>
                
                <div>
                  <Label htmlFor="stylist-name">Nombre</Label>
                  <Input
                    id="stylist-name"
                    data-testid="input-stylist-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ej: María García"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stylist-experience">Experiencia</Label>
                    <Input
                      id="stylist-experience"
                      data-testid="input-stylist-experience"
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                      placeholder="ej: 5 años"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="stylist-rating">Rating (0-50)</Label>
                    <Input
                      id="stylist-rating"
                      data-testid="input-stylist-rating"
                      type="number"
                      min="0"
                      max="50"
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) || 0 })}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Se mostrará como {(formData.rating / 10).toFixed(1)} estrellas
                    </p>
                  </div>
                </div>
                
                <div>
                  <Label>Servicios que Ofrece</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Selecciona los servicios que este estilista puede realizar
                  </p>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center space-x-2"
                        data-testid={`service-checkbox-container-${service.id}`}
                      >
                        <Checkbox
                          id={`service-${service.id}`}
                          data-testid={`checkbox-service-${service.id}`}
                          checked={formData.specialties.includes(service.name)}
                          onCheckedChange={() => toggleService(service.name)}
                        />
                        <label
                          htmlFor={`service-${service.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {service.name}
                        </label>
                      </div>
                    ))}
                  </div>
                  {formData.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                      {formData.specialties.map((specialty) => (
                        <Badge
                          key={specialty}
                          variant="secondary"
                          data-testid={`badge-specialty-${specialty}`}
                        >
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  )}
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
                <Button type="submit" data-testid="button-submit-stylist">
                  {editingStylist ? "Actualizar" : "Crear"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stylists.map((stylist) => (
          <Card key={stylist.id} className="hover-elevate" data-testid={`stylist-card-${stylist.id}`}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{stylist.name}</span>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(stylist)}
                    data-testid={`button-edit-stylist-${stylist.id}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(stylist.id)}
                    data-testid={`button-delete-stylist-${stylist.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardTitle>
              <CardDescription className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="w-4 h-4" />
                  <span>{stylist.experience}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-primary text-primary" />
                  <span className="text-sm font-medium">{(stylist.rating / 10).toFixed(1)}</span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {stylist.specialties.map((specialty) => (
                    <Badge key={specialty} variant="outline">
                      {specialty}
                    </Badge>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleManageAvailability(stylist)}
                  data-testid={`button-manage-availability-${stylist.id}`}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Gestionar Horarios
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Availability Management Dialog */}
      <Dialog open={isAvailabilityDialogOpen} onOpenChange={handleOpenAvailabilityDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-availability">
          <DialogHeader>
            <DialogTitle>Gestionar Horarios - {availabilityStylist?.name}</DialogTitle>
            <DialogDescription>
              Define los días y horarios de trabajo del estilista
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {availabilitySlots.map((slot, index) => (
              <Card key={index} className="p-4">
                <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-3 items-end">
                  <div>
                    <Label>Día de la semana</Label>
                    <Select
                      value={slot.dayOfWeek.toString()}
                      onValueChange={(value) => updateAvailabilitySlot(index, "dayOfWeek", parseInt(value))}
                    >
                      <SelectTrigger data-testid={`select-day-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((day) => (
                          <SelectItem key={day.value} value={day.value.toString()}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Hora inicio</Label>
                    <Input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateAvailabilitySlot(index, "startTime", e.target.value)}
                      data-testid={`input-start-time-${index}`}
                    />
                  </div>

                  <div>
                    <Label>Hora fin</Label>
                    <Input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => updateAvailabilitySlot(index, "endTime", e.target.value)}
                      data-testid={`input-end-time-${index}`}
                    />
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAvailabilitySlot(index)}
                    data-testid={`button-remove-slot-${index}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}

            <Button
              variant="outline"
              onClick={addAvailabilitySlot}
              className="w-full"
              data-testid="button-add-availability-slot"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Horario
            </Button>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAvailabilityDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveAvailability}
              disabled={saveAvailabilityMutation.isPending}
              data-testid="button-save-availability"
            >
              {saveAvailabilityMutation.isPending ? "Guardando..." : "Guardar Horarios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
