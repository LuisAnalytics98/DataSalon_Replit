import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Salon, InsertSalon, User, SalonUser } from "@shared/schema";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SuperAdmin() {
  const [isSalonDialogOpen, setIsSalonDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingSalon, setEditingSalon] = useState<Salon | null>(null);
  const [selectedSalonId, setSelectedSalonId] = useState<string>("");
  const [salonFormData, setSalonFormData] = useState<InsertSalon>({
    name: "",
    slug: "",
    description: "",
  });
  const { toast } = useToast();

  // Fetch all salons
  const { data: salons = [], isLoading: salonsLoading } = useQuery<Salon[]>({
    queryKey: ["/api/superadmin/salons"],
  });

  // Fetch all users
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/superadmin/users"],
  });

  // Fetch users for selected salon
  const { data: salonUsers = [] } = useQuery<Array<SalonUser & { user: User }>>({
    queryKey: ["/api/superadmin/salons", selectedSalonId, "users"],
    enabled: !!selectedSalonId,
  });

  // Create salon mutation
  const createSalonMutation = useMutation({
    mutationFn: async (salon: InsertSalon) => {
      const response = await apiRequest("POST", "/api/superadmin/salons", salon);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/salons"] });
      setIsSalonDialogOpen(false);
      resetSalonForm();
      toast({
        title: "Salón creado",
        description: "El salón se ha creado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el salón.",
        variant: "destructive",
      });
    },
  });

  // Update salon mutation
  const updateSalonMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertSalon> }) => {
      const response = await apiRequest("PATCH", `/api/superadmin/salons/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/salons"] });
      setIsSalonDialogOpen(false);
      resetSalonForm();
      toast({
        title: "Salón actualizado",
        description: "El salón se ha actualizado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el salón.",
        variant: "destructive",
      });
    },
  });

  // Delete salon mutation
  const deleteSalonMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/superadmin/salons/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/salons"] });
      toast({
        title: "Salón eliminado",
        description: "El salón se ha eliminado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el salón.",
        variant: "destructive",
      });
    },
  });

  // Assign user to salon mutation
  const assignUserMutation = useMutation({
    mutationFn: async (data: { userId: string; salonId: string; role: string }) => {
      const response = await apiRequest("POST", "/api/superadmin/salon-users", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/salons", selectedSalonId, "users"] });
      setIsUserDialogOpen(false);
      toast({
        title: "Usuario asignado",
        description: "El usuario se ha asignado exitosamente al salón.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo asignar el usuario al salón.",
        variant: "destructive",
      });
    },
  });

  // Remove user from salon mutation
  const removeUserMutation = useMutation({
    mutationFn: async (data: { userId: string; salonId: string }) => {
      const response = await apiRequest("DELETE", "/api/superadmin/salon-users", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/superadmin/salons", selectedSalonId, "users"] });
      toast({
        title: "Usuario eliminado",
        description: "El usuario se ha eliminado del salón.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el usuario del salón.",
        variant: "destructive",
      });
    },
  });

  const resetSalonForm = () => {
    setSalonFormData({
      name: "",
      slug: "",
      description: "",
    });
    setEditingSalon(null);
  };

  const handleSalonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSalon) {
      updateSalonMutation.mutate({ id: editingSalon.id, data: salonFormData });
    } else {
      createSalonMutation.mutate(salonFormData);
    }
  };

  const handleEditSalon = (salon: Salon) => {
    setEditingSalon(salon);
    setSalonFormData({
      name: salon.name,
      slug: salon.slug,
      description: salon.description || "",
    });
    setIsSalonDialogOpen(true);
  };

  const handleDeleteSalon = (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este salón?")) {
      deleteSalonMutation.mutate(id);
    }
  };

  const handleAssignUser = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const userId = formData.get("userId") as string;
    const role = formData.get("role") as string;

    assignUserMutation.mutate({
      userId,
      salonId: selectedSalonId,
      role,
    });
  };

  const handleRemoveUser = (userId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este usuario del salón?")) {
      removeUserMutation.mutate({ userId, salonId: selectedSalonId });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-playfair text-foreground">Panel de Super Administrador</h1>
        </div>

        {/* Salons Management */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Salones</CardTitle>
                <CardDescription>Gestiona todos los salones del sistema</CardDescription>
              </div>
              <Button
                onClick={() => {
                  resetSalonForm();
                  setIsSalonDialogOpen(true);
                }}
                data-testid="button-create-salon"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Salón
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {salonsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Cargando salones...</div>
            ) : salons.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay salones creados todavía.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {salons.map((salon) => (
                  <Card key={salon.id} data-testid={`card-salon-${salon.id}`}>
                    <CardHeader>
                      <CardTitle className="text-lg">{salon.name}</CardTitle>
                      <CardDescription className="font-mono text-xs">/{salon.slug}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {salon.description && (
                        <p className="text-sm text-muted-foreground mb-4">{salon.description}</p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSalonId(salon.id);
                            setIsUserDialogOpen(true);
                          }}
                          data-testid={`button-manage-users-${salon.id}`}
                        >
                          <Users className="w-4 h-4 mr-1" />
                          Usuarios
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditSalon(salon)}
                          data-testid={`button-edit-salon-${salon.id}`}
                        >
                          <Pencil className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSalon(salon.id)}
                          data-testid={`button-delete-salon-${salon.id}`}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Salon Create/Edit Dialog */}
        <Dialog open={isSalonDialogOpen} onOpenChange={setIsSalonDialogOpen}>
          <DialogContent data-testid="dialog-salon-form">
            <DialogHeader>
              <DialogTitle>
                {editingSalon ? "Editar Salón" : "Crear Nuevo Salón"}
              </DialogTitle>
              <DialogDescription>
                {editingSalon
                  ? "Actualiza la información del salón."
                  : "Ingresa la información del nuevo salón."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSalonSubmit}>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Nombre del Salón</Label>
                  <Input
                    id="name"
                    value={salonFormData.name}
                    onChange={(e) => setSalonFormData({ ...salonFormData, name: e.target.value })}
                    placeholder="Mi Salón de Belleza"
                    required
                    data-testid="input-salon-name"
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug (URL)</Label>
                  <Input
                    id="slug"
                    value={salonFormData.slug}
                    onChange={(e) => setSalonFormData({ ...salonFormData, slug: e.target.value })}
                    placeholder="mi-salon"
                    required
                    data-testid="input-salon-slug"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Se usará en la URL: /book/{salonFormData.slug || "slug"}
                  </p>
                </div>
                <div>
                  <Label htmlFor="description">Descripción (opcional)</Label>
                  <Textarea
                    id="description"
                    value={salonFormData.description || ""}
                    onChange={(e) =>
                      setSalonFormData({ ...salonFormData, description: e.target.value })
                    }
                    placeholder="Descripción del salón..."
                    data-testid="input-salon-description"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSalonDialogOpen(false)}
                  data-testid="button-cancel-salon"
                >
                  Cancelar
                </Button>
                <Button type="submit" data-testid="button-save-salon">
                  {editingSalon ? "Actualizar" : "Crear"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* User Management Dialog */}
        <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
          <DialogContent className="max-w-2xl" data-testid="dialog-user-management">
            <DialogHeader>
              <DialogTitle>Gestionar Usuarios del Salón</DialogTitle>
              <DialogDescription>
                Asigna o elimina usuarios del salón seleccionado.
              </DialogDescription>
            </DialogHeader>
            
            {/* Current Users */}
            <div className="space-y-4">
              <h3 className="font-semibold">Usuarios Actuales</h3>
              {salonUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay usuarios asignados a este salón.</p>
              ) : (
                <div className="space-y-2">
                  {salonUsers.map((su) => (
                    <div
                      key={su.id}
                      className="flex items-center justify-between p-3 border rounded-md"
                      data-testid={`user-item-${su.userId}`}
                    >
                      <div>
                        <p className="font-medium" data-testid={`text-user-name-${su.userId}`}>
                          {su.user.firstName} {su.user.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">{su.user.email}</p>
                        <p className="text-xs text-muted-foreground capitalize">Rol: {su.role}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveUser(su.userId)}
                        data-testid={`button-remove-user-${su.userId}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Assign New User */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Asignar Nuevo Usuario</h3>
              <form onSubmit={handleAssignUser} className="space-y-4">
                <div>
                  <Label htmlFor="userId">Usuario</Label>
                  <Select name="userId" required>
                    <SelectTrigger data-testid="select-user">
                      <SelectValue placeholder="Selecciona un usuario" />
                    </SelectTrigger>
                    <SelectContent>
                      {users
                        .filter((u) => !salonUsers.some((su) => su.userId === u.id))
                        .map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.firstName} {user.lastName} ({user.email})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="role">Rol</Label>
                  <Select name="role" defaultValue="employee">
                    <SelectTrigger data-testid="select-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Propietario</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="employee">Empleado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" data-testid="button-assign-user">
                  Asignar Usuario
                </Button>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
