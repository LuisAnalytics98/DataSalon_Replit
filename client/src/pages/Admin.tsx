import { useState } from "react";
import Header from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KanbanBoard from "@/components/admin/KanbanBoard";
import ServicesManagement from "@/components/admin/ServicesManagement";
import StylistsManagement from "@/components/admin/StylistsManagement";
import { LayoutDashboard, Scissors, Users } from "lucide-react";

export default function Admin() {
  const [activeTab, setActiveTab] = useState("kanban");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "Playfair Display, serif" }}>
            Panel de Administración
          </h1>
          <p className="text-muted-foreground">
            Gestiona reservas, servicios y el equipo del salón
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8" data-testid="admin-tabs">
            <TabsTrigger value="kanban" className="flex items-center gap-2" data-testid="tab-kanban">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Tablero de Reservas</span>
              <span className="sm:hidden">Reservas</span>
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2" data-testid="tab-services">
              <Scissors className="w-4 h-4" />
              <span className="hidden sm:inline">Servicios</span>
              <span className="sm:hidden">Servicios</span>
            </TabsTrigger>
            <TabsTrigger value="stylists" className="flex items-center gap-2" data-testid="tab-stylists">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Estilistas</span>
              <span className="sm:hidden">Equipo</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="kanban" className="mt-0">
            <KanbanBoard />
          </TabsContent>

          <TabsContent value="services" className="mt-0">
            <ServicesManagement />
          </TabsContent>

          <TabsContent value="stylists" className="mt-0">
            <StylistsManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
