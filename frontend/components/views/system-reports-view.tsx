"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, RefreshCw } from "lucide-react"

export function SystemReportsView() {
  const [overview, setOverview] = useState<any>(null)
  const [tenantStats, setTenantStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [overviewData, tenantsData] = await Promise.all([
        api.auth.getSystemOverview?.(),
        api.auth.getTenantsWithStats?.(),
      ])
      if (overviewData) setOverview(overviewData)
      if (tenantsData) setTenantStats(Array.isArray(tenantsData?.tenants) ? tenantsData.tenants : [])
    } catch (err: any) {
      setError(err?.message || "Error desconocido al cargar informes del sistema")
      console.error("Error loading system reports:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
        <Alert variant="destructive">
          <AlertTitle>Error cargando informes del sistema</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4 flex gap-3">
          <Button onClick={fetchData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Recargar página
          </Button>
        </div>
        <div className="mt-4 text-xs text-muted-foreground max-w-md px-4">
          <ul className="list-disc list-inside mt-1 text-left">
            <li>Verifique que el backend esté desplegado en Render con los cambios más recientes</li>
            <li>Cierre sesión y vuelva a entrar para obtener un token con rol superadmin</li>
            <li>Verifique que su usuario tenga el rol <code>superadmin</code> en la base de datos</li>
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Informes del Sistema</h1>
        <p className="text-muted-foreground">Vista general de todos los hoteles registrados en el sistema.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Hoteles</CardTitle>
          </CardHeader>
          <CardContent>{overview?.totalTenants ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Usuarios</CardTitle>
          </CardHeader>
          <CardContent>{overview?.totalUsers ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Habitaciones</CardTitle>
          </CardHeader>
          <CardContent>{overview?.totalRooms ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Reservas</CardTitle>
          </CardHeader>
          <CardContent>{overview?.totalReservations ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ingresos</CardTitle>
          </CardHeader>
          <CardContent>${overview?.totalRevenue ?? 0}</CardContent>
        </Card>
      </div>

      {tenantStats.length > 0 && (
        <div className="bg-card border border-border p-4">
          <h2 className="text-lg font-semibold mb-4">Hoteles registrados</h2>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b">
                <th className="pb-2 text-muted-foreground text-sm">Hotel</th>
                <th className="pb-2 text-muted-foreground text-sm text-center">Usuarios</th>
                <th className="pb-2 text-muted-foreground text-sm text-center">Habitaciones</th>
                <th className="pb-2 text-muted-foreground text-sm text-center">Reservas</th>
                <th className="pb-2 text-muted-foreground text-sm text-right">Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {tenantStats.map((t) => (
                <tr key={t.id} className="border-b">
                  <td className="py-2">{t.name}</td>
                  <td className="py-2 text-center">{t.userCount}</td>
                  <td className="py-2 text-center">{t.roomCount}</td>
                  <td className="py-2 text-center">{t.reservationCount}</td>
                  <td className="py-2 text-right">${t.revenue?.toLocaleString() ?? "0"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
