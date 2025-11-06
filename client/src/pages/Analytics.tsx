import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";
import { TrendingUp, Users, DollarSign, Calendar } from "lucide-react";
import { subDays, subMonths, startOfMonth, endOfMonth, format } from "date-fns";

type TimeRange = "today" | "week" | "month" | "all";

interface AnalyticsData {
  summary: {
    totalRevenue: number;
    totalBookings: number;
    completedBookings: number;
    averageTicket: number;
  };
  popularServices: Array<{ name: string; count: number; revenue: number }>;
  topStylists: Array<{ name: string; bookings: number; revenue: number }>;
  topClients: Array<{ name: string; email: string; bookings: number; revenue: number }>;
  revenueByService: Array<{ name: string; revenue: number }>;
  statusBreakdown: {
    pending: number;
    confirmed: number;
    in_progress: number;
    done: number;
    cancelled: number;
  };
}

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>("month");

  const getDateRange = () => {
    const now = new Date();
    switch (timeRange) {
      case "today":
        return { 
          startDate: format(now, "yyyy-MM-dd"), 
          endDate: format(now, "yyyy-MM-dd") 
        };
      case "week":
        return { 
          startDate: format(subDays(now, 7), "yyyy-MM-dd"), 
          endDate: format(now, "yyyy-MM-dd") 
        };
      case "month":
        return { 
          startDate: format(startOfMonth(now), "yyyy-MM-dd"), 
          endDate: format(endOfMonth(now), "yyyy-MM-dd") 
        };
      case "all":
        return {};
      default:
        return {};
    }
  };

  const { startDate, endDate } = getDateRange();

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/admin/analytics", startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      const response = await fetch(`/api/admin/analytics?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch analytics");
      return response.json();
    },
  });

  const formatCurrency = (amount: number) => {
    return `₡${amount.toLocaleString("es-CR")}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-playfair font-bold text-foreground" data-testid="text-analytics-title">
              Análisis y Métricas
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualiza el rendimiento de tu salón
            </p>
          </div>

          <div className="w-48">
            <Label htmlFor="time-range" className="text-sm mb-2 block">
              Período de tiempo
            </Label>
            <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
              <SelectTrigger id="time-range" data-testid="select-time-range">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Este mes</SelectItem>
                <SelectItem value="all">Todo el tiempo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Cargando análisis...</p>
          </div>
        ) : analytics ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card data-testid="card-total-revenue">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-revenue-amount">
                    {formatCurrency(analytics.summary.totalRevenue)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analytics.summary.completedBookings} servicios completados
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-total-bookings">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Citas Totales</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-bookings-count">
                    {analytics.summary.totalBookings}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    En el período seleccionado
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-average-ticket">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-average-ticket">
                    {formatCurrency(analytics.summary.averageTicket)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Por servicio completado
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-completion-rate">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tasa de Finalización</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-completion-rate">
                    {analytics.summary.totalBookings > 0
                      ? Math.round((analytics.summary.completedBookings / analytics.summary.totalBookings) * 100)
                      : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Servicios finalizados exitosamente
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Popular Services */}
              <Card data-testid="card-popular-services">
                <CardHeader>
                  <CardTitle className="text-lg font-playfair">Servicios Más Populares</CardTitle>
                  <CardDescription>Los servicios más solicitados</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.popularServices.length > 0 ? (
                    <div className="space-y-4">
                      {analytics.popularServices.map((service, index) => (
                        <div key={index} className="flex items-center justify-between" data-testid={`service-${index}`}>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{service.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {service.count} {service.count === 1 ? "reserva" : "reservas"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">{formatCurrency(service.revenue)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
                  )}
                </CardContent>
              </Card>

              {/* Top Stylists */}
              <Card data-testid="card-top-stylists">
                <CardHeader>
                  <CardTitle className="text-lg font-playfair">Profesionales Destacados</CardTitle>
                  <CardDescription>Por ingresos generados</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.topStylists.length > 0 ? (
                    <div className="space-y-4">
                      {analytics.topStylists.map((stylist, index) => (
                        <div key={index} className="flex items-center justify-between" data-testid={`stylist-${index}`}>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{stylist.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {stylist.bookings} {stylist.bookings === 1 ? "cita" : "citas"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">{formatCurrency(stylist.revenue)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
                  )}
                </CardContent>
              </Card>

              {/* Revenue by Service */}
              <Card data-testid="card-revenue-breakdown">
                <CardHeader>
                  <CardTitle className="text-lg font-playfair">Desglose de Ingresos</CardTitle>
                  <CardDescription>Ingresos por tipo de servicio</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.revenueByService.length > 0 ? (
                    <div className="space-y-4">
                      {analytics.revenueByService.map((service, index) => (
                        <div key={index} className="space-y-1" data-testid={`revenue-service-${index}`}>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{service.name}</p>
                            <p className="text-sm font-medium">{formatCurrency(service.revenue)}</p>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{
                                width: `${(service.revenue / analytics.summary.totalRevenue) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
                  )}
                </CardContent>
              </Card>

              {/* Status Breakdown */}
              <Card data-testid="card-status-breakdown">
                <CardHeader>
                  <CardTitle className="text-lg font-playfair">Estado de las Citas</CardTitle>
                  <CardDescription>Distribución por estado</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <span className="text-sm">Pendientes</span>
                      </div>
                      <span className="text-sm font-medium" data-testid="status-pending">
                        {analytics.statusBreakdown.pending}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-sm">Confirmadas</span>
                      </div>
                      <span className="text-sm font-medium" data-testid="status-confirmed">
                        {analytics.statusBreakdown.confirmed}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500" />
                        <span className="text-sm">En Progreso</span>
                      </div>
                      <span className="text-sm font-medium" data-testid="status-in-progress">
                        {analytics.statusBreakdown.in_progress}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-sm">Completadas</span>
                      </div>
                      <span className="text-sm font-medium" data-testid="status-done">
                        {analytics.statusBreakdown.done}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-sm">Canceladas</span>
                      </div>
                      <span className="text-sm font-medium" data-testid="status-cancelled">
                        {analytics.statusBreakdown.cancelled}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-center">No hay datos de análisis disponibles</p>
        )}
      </div>
    </div>
  );
}
