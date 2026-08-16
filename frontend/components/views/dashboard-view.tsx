"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  BedDouble,
  DollarSign,
  ClipboardList,
  AlertTriangle,
  TrendingUp,
} from "lucide-react"
import {
  getOccupancyRate,
  getDailyRevenue,
  getPendingCheckins,
  getLowStockProducts,
  monthlyRevenueData,
  getGuestById,
  getRoomById,
} from "@/lib/store"
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
  const occupancy = useMemo(() => getOccupancyRate(), [])
  const dailyRevenue = useMemo(() => getDailyRevenue(), [])
  const pendingCheckins = useMemo(() => getPendingCheckins(), [])
  const lowStock = useMemo(() => getLowStockProducts(), [])

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
                    strokeDasharray={`${(occupancy / 100) * 175.93} 175.93`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-sm font-bold text-foreground">{occupancy}%</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{occupancy}%</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="size-3" />
                  +5% vs ayer
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
              {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(dailyRevenue)}
            </p>
            <div className="mt-2 flex gap-2">
              <Badge variant="secondary" className="text-xs">
                Hospedaje: 85%
              </Badge>
              <Badge variant="outline" className="text-xs">
                Catering: 15%
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
                const guest = getGuestById(r.guestId)
                const room = getRoomById(r.roomId)
                return (
                  <div key={r.id} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground truncate">{guest?.name}</span>
                    <Badge variant="outline" className="text-xs shrink-0">
                      Hab. {room?.number}
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
            <p className="text-2xl font-bold text-foreground">{lowStock.length}</p>
            <div className="mt-2 flex flex-col gap-1.5">
              {lowStock.map((p) => (
                <div key={p.id} className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground truncate">{p.name}</span>
                      <span className="text-destructive font-medium shrink-0">{p.currentStock}/{p.minStock}</span>
                    </div>
                    <Progress value={(p.currentStock / p.minStock) * 100} className="mt-1 h-1.5" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Ingresos vs. Gastos Mensuales</CardTitle>
          <CardDescription>Ultimos 6 meses de actividad financiera</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <BarChart data={monthlyRevenueData} barGap={4}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) =>
                      new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number(value))
                    }
                  />
                }
              />
              <Bar dataKey="ingresos" fill="var(--color-ingresos)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gastos" fill="var(--color-gastos)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
