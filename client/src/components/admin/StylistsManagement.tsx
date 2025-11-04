import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Stylist, InsertStylist } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Star, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function StylistsManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStylist, setEditingStylist] = useState<Stylist | null>(null);
  const [formData, setFormData] = useState<InsertStylist>({
    id: "",
    name: "",
    experience: "",
    rating: 40,
    specialties: [],
  });
  const [specialtyInput, setSpecialtyInput] = useState("");
  const { toast } = useToast();

  const { data: stylists = [], isLoading } = useQuery<Stylist[]>({
    queryKey: ["/api/stylists"],
  });

  const createMutation = useMutation({
    mutationFn: async (stylist: InsertStylist) => {
      const response = await apiRequest("POST", "/api/admin/stylists", stylist);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stylists"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/stylists"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/stylists"] });
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

  const resetForm = () => {
    setFormData({
      id: "",
      name: "",
      experience: "",
      rating: 40,
      specialties: [],
    });
    setSpecialtyInput("");
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

  const addSpecialty = () => {
    if (specialtyInput.trim() && !formData.specialties.includes(specialtyInput.trim())) {
      setFormData({
        ...formData,
        specialties: [...formData.specialties, specialtyInput.trim()],
      });
      setSpecialtyInput("");
    }
  };

  const removeSpecialty = (specialty: string) => {
    setFormData({
      ...formData,
      specialties: formData.specialties.filter(s => s !== specialty),
    });
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
                  <Label htmlFor="specialty-input">Especialidades</Label>
                  <div className="flex gap-2">
                    <Input
                      id="specialty-input"
                      data-testid="input-specialty"
                      value={specialtyInput}
                      onChange={(e) => setSpecialtyInput(e.target.value)}
                      placeholder="ej: Corte"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSpecialty();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addSpecialty}
                      data-testid="button-add-specialty"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.specialties.map((specialty) => (
                      <Badge
                        key={specialty}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeSpecialty(specialty)}
                        data-testid={`badge-specialty-${specialty}`}
                      >
                        {specialty} ×
                      </Badge>
                    ))}
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
              <div className="flex flex-wrap gap-2">
                {stylist.specialties.map((specialty) => (
                  <Badge key={specialty} variant="outline">
                    {specialty}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
