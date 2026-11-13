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
  RefreshCw,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { api } from "@/lib/api"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

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

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [overviewData, tenantsData] = await Promise.all([
        api.auth.getSystemOverview?.(),
        api.auth.getTenantsWithStats?.(),
      ])
      if (overviewData) setOverview(overviewData)
      if (tenantsData) setTenantStats(tenantsData.tenants)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido al cargar informes del sistema"
      setError(msg)
      console.error("Error loading system reports:", err)
      toast({
        title: "Error al cargar informes del sistema",
        description: msg,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">Cargando informes del sistema...</p>
        </div>
      </div>
    )
  }

  if (error && !overview && tenantStats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
        <AlertTriangle className="mb-4 h-10 w-10 text-destructive" />
        <Alert variant="destructive">
          <AlertTitle>Error cargando informes del sistema</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4 flex gap-3">
          <Button onClick={() => fetchData()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Recargar página
          </Button>
        </div>
        <div className="mt-4 text-xs text-muted-foreground max-w-md px-4">
          <p>Si el error persiste, verifique:</p>
          <ul className="list-disc list-inside mt-1 text-left">
            <li>Que el backend esté desplegado con los cambios más recientes en Render</li>
            <li>Que su usuario tenga el rol <code>superadmin</code> en la base de datos</li>
            <li>Que las cookies de sesión sean válidas (cierre sesión y vuelva a entrar)</li>
          </ul>
        </div>
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
        <div className="flex items-center gap-2">
          <Button
            onClick={() => fetchData()}
            disabled={loading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
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
