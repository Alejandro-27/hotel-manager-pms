"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Badge,
} from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Building2,
  Users,
  BedDouble,
  Calendar,
  CreditCard,
  TrendingUp,
  Loader2,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { api } from "@/lib/api"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface SystemOverview {
  totalTenants: number
  totalUsers: number
  activeUsers: number
  pendingUsers: number
  totalRooms: number
  occupiedRooms: number
  totalReservations: number
  activeReservations: number
  totalSales: number
  totalRevenue: number
}

interface TenantStats {
  id: string
  name: string
  slug: string
  userCount: number
  roomCount: number
  reservationCount: number
  revenue: number
}

export function SystemReportsView() {
  const [overview, setOverview] = useState<SystemOverview | null>(null)
  const [tenantStats, setTenantStats] = useState<TenantStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOverview = useCallback(async () => {
    try {
      const data = await api.auth.getSystemOverview?.()
      if (data) setOverview(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar informes del sistema")
      toast({
        title: "Error al cargar informes del sistema",
        description: err instanceof Error ? err.message : "Intente de nuevo",
        variant: "destructive",
      })
    }
  }, [])

  const fetchTenantStats = useCallback(async () => {
    try {
      const data = await api.auth.getTenantsWithStats?.()
      if (data) setTenantStats(data.tenants)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar estadísticas de hoteles")
      toast({
        title: "Error al cargar estadísticas de hoteles",
        description: err instanceof Error ? err.message : "Intente de nuevo",
        variant: "destructive",
      })
    }
  }, [])

  useEffect(() => {
    Promise.all([fetchOverview(), fetchTenantStats()]).finally(() => setLoading(false))
  }, [fetchOverview, fetchTenantStats])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error && !overview && tenantStats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertTriangle className="mb-4 h-8 w-8 text-destructive" />
        <Alert variant="destructive">
          <AlertTitle>Error cargando informes</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Informes del Sistema</h1>
          <p className="text-muted-foreground">
            Vista general de todos los hoteles registrados en el sistema.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoteles</CardTitle>
            <Badge variant="outline">{overview?.totalTenants ?? 0}</Badge>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
            <Badge variant="outline">{overview?.totalUsers ?? 0}</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {overview?.activeUsers ?? 0} activos · {overview?.pendingUsers ?? 0} pendientes
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Habitaciones</CardTitle>
            <Badge variant="outline">{overview?.totalRooms ?? 0}</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {overview?.occupiedRooms ?? 0} ocupadas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reservas</CardTitle>
            <Badge variant="outline">{overview?.totalReservations ?? 0}</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {overview?.activeReservations ?? 0} activas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <Badge variant="outline">
              ${overview?.totalRevenue ?? 0}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de hoteles */}
      <div className="bg-card border border-border">
        <CardHeader>
          <CardTitle>Hoteles registrados</CardTitle>
        </CardHeader>
        <CardContent>
          {tenantStats.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No hay hoteles registrados.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hotel</TableHead>
                  <TableHead className="text-center">Usuarios</TableHead>
                  <TableHead className="text-center">Habitaciones</TableHead>
                  <TableHead className="text-center">Reservas</TableHead>
                  <TableHead className="text-right">Ingresos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenantStats.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="text-center">{t.userCount}</TableCell>
                    <TableCell className="text-center">{t.roomCount}</TableCell>
                    <TableCell className="text-center">{t.reservationCount}</TableCell>
                    <TableCell className="text-right">
                      ${t.revenue.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter className="flex flex-row items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Datos en tiempo real del sistema
          </span>
          <ShieldAlert className="h-3 w-3 text-muted-foreground" />
        </CardFooter>
      </div>
    </div>
  )
}
