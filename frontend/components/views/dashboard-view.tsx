"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  BedDouble,
  DollarSign,
  ClipboardList,
  AlertTriangle,
  TrendingUp,
  DoorOpen,
  Users,
  Sparkles,
  Wrench,
  CalendarCheck,
  UtensilsCrossed,
  RefreshCw,
} from "lucide-react"
import { api, type DashboardReport, type OccupancyReport, type FinancialReport } from "@/lib/api"
import type { Guest, Room, Product } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

const chartConfig = {
  ingresos: {
    label: "Ingresos",
    color: "var(--chart-1)",
  },
  gastos: {
    label: "Gastos",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function DashboardView() {
  const [dashboard, setDashboard] = useState<DashboardReport | null>(null)
  const [occupancy, setOccupancy] = useState<OccupancyReport | null>(null)
  const [financial, setFinancial] = useState<FinancialReport | null>(null)
  const [guests, setGuests] = useState<Guest[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<(import("@/lib/types").Sale)[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkingIn, setCheckingIn] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useMemo(
    () => () => {
      setLoading(true)
      setError(null)
      Promise.all([
        api.reports.dashboard(),
        api.reports.occupancy(),
        api.reports.financial().catch(() => null),
        api.guests.get(),
        api.rooms.get(),
        api.products.get(),
        api.sales.get(),
      ])
        .then(([dash, occ, fin, g, r, p, s]) => {
          setDashboard(dash)
          setOccupancy(occ)
          setFinancial(fin)
          setGuests(g)
          setRooms(r)
          setProducts(p)
          setSales(s)
        })
        .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar los datos"))
        .finally(() => setLoading(false))
    },
    []
  )

  useEffect(() => {
    load()
  }, [load])

  async function handleCheckin(id: string) {
    setCheckingIn(id)
    setActionError(null)
    try {
      await api.reservations.checkin(id)
      load()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error en el check-in")
    } finally {
      setCheckingIn(null)
    }
  }

  const guestMap = useMemo(() => new Map(guests.map((g) => [g.id, g])), [guests])
  const roomMap = useMemo(() => new Map(rooms.map((r) => [r.id, r])), [rooms])

  const byStatus = useMemo(() => {
    if (!occupancy) return { libre: 0, ocupada: 0, mantenimiento: 0, limpieza: 0 }
    const map: Record<string, number> = {}
    occupancy.byStatus.forEach((s) => { map[s.status] = s.count })
    return { libre: map.libre ?? 0, ocupada: map.ocupada ?? 0, mantenimiento: map.mantenimiento ?? 0, limpieza: map.limpieza ?? 0 }
  }, [occupancy])

  const pendingCheckins = dashboard?.pendingCheckins ?? []

  const todayReservations = useMemo(
    () => pendingCheckins.slice(0, 5),
    [pendingCheckins]
  )

  const topProducts = useMemo(() => {
    const countMap: Record<string, number> = {}
    sales.forEach((s) => {
      s.items.forEach((i) => {
        countMap[i.productId] = (countMap[i.productId] || 0) + i.quantity
      })
    })
    return Object.entries(countMap)
      .map(([id, qty]) => {
        const product = products.find((p) => p.id === id)
        return { product, qty }
      })
      .filter((x): x is { product: Product; qty: number } => x.product !== undefined)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)
  }, [sales, products])

  const maxTopQty = topProducts.length ? topProducts[0].qty : 1
  const monthlyRevenueData = financial?.monthlyRevenue ?? []

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-[350px] lg:col-span-2" />
          <Skeleton className="h-[350px]" />
        </div>
      </div>
    )
  }

  if (error && !dashboard) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <AlertTriangle className="size-10 text-destructive" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={load}><RefreshCw className="mr-1 size-4" /> Reintentar</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Panel de Control</h1>
        <p className="text-muted-foreground text-sm">Vista ejecutiva del rendimiento del hotel</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Occupancy */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tasa de Ocupacion</CardTitle>
            <BedDouble className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="relative flex size-16 items-center justify-center">
                <svg className="size-16 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" strokeWidth="6" className="stroke-muted" />
                  <circle
                    cx="32" cy="32" r="28" fill="none" strokeWidth="6"
                    className="stroke-primary"
                    strokeDasharray={`${((dashboard?.occupancyRate ?? 0) / 100) * 175.93} 175.93`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-sm font-bold text-foreground">{dashboard?.occupancyRate ?? 0}%</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{dashboard?.occupancyRate ?? 0}%</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="size-3 text-emerald-600" />
                  {occupancy?.occupiedRooms ?? 0}/{occupancy?.totalRooms ?? 0} habitaciones
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos Diarios</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(dashboard?.dailyRevenue ?? 0)}
            </p>
            <div className="mt-2 flex gap-2">
              <Badge variant="secondary" className="text-xs">
                Hospedaje + Catering
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Pending Check-ins */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Check-ins Pendientes</CardTitle>
            <ClipboardList className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{pendingCheckins.length}</p>
            <div className="mt-2 flex flex-col gap-1">
              {pendingCheckins.slice(0, 3).map((r) => {
                const guest = guestMap.get(r.guestId)
                const room = roomMap.get(r.roomId)
                return (
                  <div key={r.id} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground truncate">{guest?.name ?? "—"}</span>
                    <Badge variant="outline" className="text-xs shrink-0">
                      Hab. {room?.number ?? "—"}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Inventory Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Alertas de Inventario</CardTitle>
            <AlertTriangle className="size-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{dashboard?.lowStockProducts.length ?? 0}</p>
            <div className="mt-2 flex flex-col gap-1.5">
              {(dashboard?.lowStockProducts ?? []).slice(0, 3).map((p) => (
                <div key={p.id} className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground truncate">{p.name}</span>
                      <span className="text-destructive font-medium shrink-0">{p.currentStock}/{p.minStock}</span>
                    </div>
                    <Progress value={(p.currentStock / Math.max(p.minStock, 1)) * 100} className="mt-1 h-1.5" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Room Status Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="border-emerald-200/60">
          <CardContent className="pt-5 pb-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-emerald-100">
              <DoorOpen className="size-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Habitaciones Libres</p>
              <p className="text-xl font-bold text-foreground">{byStatus.libre}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/20">
          <CardContent className="pt-5 pb-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-primary/10">
              <Users className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Habitaciones Ocupadas</p>
              <p className="text-xl font-bold text-foreground">{byStatus.ocupada}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-sky-200/60">
          <CardContent className="pt-5 pb-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-sky-100">
              <Sparkles className="size-5 text-sky-700" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">En Limpieza</p>
              <p className="text-xl font-bold text-foreground">{byStatus.limpieza}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200/60">
          <CardContent className="pt-5 pb-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-amber-100">
              <Wrench className="size-5 text-amber-700" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">En Mantenimiento</p>
              <p className="text-xl font-bold text-foreground">{byStatus.mantenimiento}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts + Side panels */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-foreground">Ingresos vs. Gastos Mensuales</CardTitle>
            <CardDescription>Ultimos 6 meses de actividad financiera</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyRevenueData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[350px] w-full">
                <BarChart data={monthlyRevenueData} barGap={4}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatCurrency(Number(value))}
                      />
                    }
                  />
                  <Bar dataKey="ingresos" fill="var(--color-ingresos)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="gastos" fill="var(--color-gastos)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[350px] items-center justify-center text-sm text-muted-foreground">
                Sin datos financieros disponibles
              </div>
            )}
          </CardContent>
        </Card>

        {/* Check-ins today / active */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-foreground text-base">
                <CalendarCheck className="size-4" />
                Check-ins Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {todayReservations.length === 0 && (
                <p className="text-sm text-muted-foreground">No hay llegadas pendientes</p>
              )}
              {todayReservations.map((r) => {
                const guest = guestMap.get(r.guestId)
                const room = roomMap.get(r.roomId)
                return (
                  <div key={r.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground shrink-0">
                        {guest?.name.charAt(0).toUpperCase() ?? "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground leading-tight truncate">{guest?.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">Hab. {room?.number ?? "—"}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="h-7 px-2 text-xs shrink-0"
                      disabled={checkingIn === r.id}
                      onClick={() => handleCheckin(r.id)}
                    >
                      {checkingIn === r.id ? (
                        <svg className="animate-spin h-3.5 w-3.5 mr-1" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <DoorOpen className="mr-1 size-3" />
                      )}
                      Check-in
                    </Button>
                  </div>
                )
              })}
              {actionError && <p className="text-xs text-destructive">{actionError}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-foreground text-base">
                <UtensilsCrossed className="size-4" />
                Top Productos
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {topProducts.length === 0 && (
                <p className="text-sm text-muted-foreground">Sin ventas registradas</p>
              )}
              {topProducts.map((t) => (
                <div key={t.product.id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-foreground truncate">{t.product.name}</span>
                    <span className="text-muted-foreground text-xs">{t.qty} unid.</span>
                  </div>
                  <Progress value={(t.qty / maxTopQty) * 100} className="h-1.5" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}