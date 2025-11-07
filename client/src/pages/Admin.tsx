import { useState } from "react";
import Header from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KanbanBoard from "@/components/admin/KanbanBoard";
import AdminCalendar from "@/components/admin/AdminCalendar";
import ServicesManagement from "@/components/admin/ServicesManagement";
import StylistsManagement from "@/components/admin/StylistsManagement";
import SalonSettings from "@/components/admin/SalonSettings";
import Analytics from "@/pages/Analytics";
import { LayoutDashboard, Scissors, Users, TrendingUp, Calendar, Settings } from "lucide-react";

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
          <TabsList className="grid w-full grid-cols-6 mb-8" data-testid="admin-tabs">
            <TabsTrigger value="kanban" className="flex items-center gap-2" data-testid="tab-kanban">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Tablero</span>
              <span className="sm:hidden">Tablero</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2" data-testid="tab-calendar">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Calendario</span>
              <span className="sm:hidden">Calendario</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2" data-testid="tab-analytics">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Análisis</span>
              <span className="sm:hidden">Análisis</span>
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2" data-testid="tab-services">
              <Scissors className="w-4 h-4" />
              <span className="hidden sm:inline">Servicios</span>
              <span className="sm:hidden">Servicios</span>
            </TabsTrigger>
            <TabsTrigger value="stylists" className="flex items-center gap-2" data-testid="tab-stylists">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Profesionales</span>
              <span className="sm:hidden">Equipo</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2" data-testid="tab-settings">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Configuración</span>
              <span className="sm:hidden">Config</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="kanban" className="mt-0">
            <KanbanBoard />
          </TabsContent>

          <TabsContent value="calendar" className="mt-0">
            <AdminCalendar />
          </TabsContent>

          <TabsContent value="analytics" className="mt-0">
            <Analytics />
          </TabsContent>

          <TabsContent value="services" className="mt-0">
            <ServicesManagement />
          </TabsContent>

          <TabsContent value="stylists" className="mt-0">
            <StylistsManagement />
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <SalonSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
