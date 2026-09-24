"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  BedDouble,
  Users,
  Euro,
  DollarSign,
  Calendar,
  Download,
  ArrowUpRight,
  UtensilsCrossed,
  Star,
  Target,
  Receipt,
  AlertCircle,
  RefreshCw,
  ShieldAlert,
  Plus,
  Trash2,
} from "lucide-react"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from "recharts"
import { api, type FinancialReport, type OccupancyReport } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import type { Invoice, Reservation, Room, Guest, Product, Sale, Expense } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const typeLabels: Record<string, string> = {
  individual: 'Individual',
  doble: 'Doble',
  suite: 'Suite',
  familiar: 'Familiar',
}
const statusLabels: Record<string, string> = {
  libre: 'Libre',
  ocupada: 'Ocupada',
  mantenimiento: 'Mantenimiento',
  limpieza: 'Limpieza',
}
const weekdayNames = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']

function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)
}

function monthlyFromInvoices(inv: Invoice[]): { month: string; ingresos: number; gastos: number }[] {
  const byMonth: Record<string, number> = {}
  for (const i of inv) {
    const key = i.date.slice(0, 7)
    byMonth[key] = (byMonth[key] ?? 0) + i.subtotal
  }
  const result: { month: string; ingresos: number; gastos: number }[] = []
  const now = new Date()
  for (let off = 5; off >= 0; off--) {
    const d = new Date(now.getFullYear(), now.getMonth() - off, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    result.push({ month: monthNames[d.getMonth()], ingresos: byMonth[key] ?? 0, gastos: 0 })
  }
  return result
}

const revenueConfig = {
  ingresos: { label: "Ingresos", color: "var(--chart-1)" },
  gastos: { label: "Gastos", color: "var(--chart-2)" },
} satisfies ChartConfig

const statusConfig = {
  libre: { label: "Libre", color: "var(--chart-2)" },
  ocupada: { label: "Ocupada", color: "var(--chart-1)" },
  mantenimiento: { label: "Mantenimiento", color: "var(--chart-3)" },
  limpieza: { label: "Limpieza", color: "var(--chart-4)" },
} satisfies ChartConfig

const salesConfig = {
  amount: { label: "Ventas", color: "var(--chart-3)" },
} satisfies ChartConfig

const pieConfig = {
  desayunos: { label: "Desayunos", color: "var(--chart-1)" },
  snacks: { label: "Snacks", color: "var(--chart-2)" },
  bebidas: { label: "Bebidas", color: "var(--chart-3)" },
} satisfies ChartConfig

export function ReportsView() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [period, setPeriod] = useState("6m")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [rooms, setRooms] = useState<Room[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [financial, setFinancial] = useState<FinancialReport | null>(null)
  const [occupancy, setOccupancy] = useState<OccupancyReport | null>(null)

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)
  const [creatingExpense, setCreatingExpense] = useState(false)
  const [expenseError, setExpenseError] = useState<string | null>(null)
  const [deletingExpense, setDeletingExpense] = useState<string | null>(null)
  const [expenseForm, setExpenseForm] = useState({
    category: "servicios" as Expense["category"],
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    note: "",
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const base = Promise.all([
        api.rooms.get(),
        api.guests.get(),
        api.reservations.get(),
        api.products.get(),
        api.sales.get(),
        api.invoices.get(),
        api.reports.occupancy(),
        isAdmin ? api.reports.financial() : Promise.resolve(null),
        isAdmin ? api.expenses.get() : Promise.resolve([] as Expense[]),
      ])
      const [r, g, res, p, s, inv, occ, fin, exp] = await base
      setRooms(r)
      setGuests(g)
      setReservations(res)
      setProducts(p)
      setSales(s)
      setInvoices(inv)
      setOccupancy(occ)
      setFinancial(fin)
      setExpenses(exp)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar los informes")
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const monthlyRevenue = useMemo(
    () => financial?.monthlyRevenue ?? monthlyFromInvoices(invoices),
    [financial, invoices]
  )
  const totalRevenue = useMemo(
    () => financial?.totalRevenue ?? invoices.reduce((s, i) => s + i.subtotal, 0),
    [financial, invoices]
  )
  const totalExpenses = useMemo(
    () => monthlyRevenue.reduce((s, m) => s + m.gastos, 0),
    [monthlyRevenue]
  )
  const netProfit = totalRevenue - totalExpenses
  const avgOccupancy = occupancy?.rate ?? 0
  const revPerRoom = useMemo(() => (rooms.length ? Math.round(totalRevenue / rooms.length) : 0), [totalRevenue, rooms.length])

  const roomById = useMemo(() => new Map(rooms.map((r) => [r.id, r])), [rooms])
  const reservationById = useMemo(() => new Map(reservations.map((r) => [r.id, r])), [reservations])

  // Ingresos por tipo de habitacion (desde facturas + reservas + habitaciones)
  const revenueByRoomType = useMemo(() => {
    const agg = new Map<string, { revenue: number; reservations: number }>()
    for (const inv of invoices) {
      const res = reservationById.get(inv.reservationId)
      const room = res ? roomById.get(res.roomId) : null
      const type = room?.type ?? 'individual'
      const entry = agg.get(type) ?? { revenue: 0, reservations: 0 }
      entry.revenue += inv.roomNights.nights * inv.roomNights.pricePerNight
      entry.reservations += 1
      agg.set(type, entry)
    }
    return [...agg.entries()].map(([type, v]) => ({ type, ...v }))
  }, [invoices, reservationById, roomById])

  // Catering: ventas por categoria y productos top
  const cateringByCategory = useMemo(() => {
    const productById = new Map(products.map((p) => [p.id, p]))
    const agg = new Map<string, number>()
    for (const s of sales) {
      for (const item of s.items) {
        const cat = productById.get(item.productId)?.category ?? 'snacks'
        agg.set(cat, (agg.get(cat) ?? 0) + item.quantity * item.unitPrice)
      }
    }
    return ['desayunos', 'snacks', 'bebidas'].map((cat) => ({
      name: cat,
      value: agg.get(cat) ?? 0,
      fill: `var(--chart-${['desayunos', 'snacks', 'bebidas'].indexOf(cat) + 1})`,
    }))
  }, [sales, products])

  const dailySales = useMemo(() => {
    const byDay = new Array(7).fill(0)
    for (const s of sales) {
      const day = (new Date(s.date + 'T00:00:00').getDay() + 6) % 7 // Lun=0
      byDay[day] += s.total
    }
    return weekdayNames.map((day, i) => ({ day, amount: Math.round(byDay[i] * 100) / 100 }))
  }, [sales])

  const topProducts = useMemo(() => {
    const productById = new Map(products.map((p) => [p.id, p]))
    const agg = new Map<string, { qty: number; revenue: number }>()
    for (const s of sales) {
      for (const item of s.items) {
        const entry = agg.get(item.productId) ?? { qty: 0, revenue: 0 }
        entry.qty += item.quantity
        entry.revenue += item.quantity * item.unitPrice
        agg.set(item.productId, entry)
      }
    }
    return [...agg.entries()]
      .map(([id, v]) => ({ product: productById.get(id)!, qty: v.qty, revenue: v.revenue }))
      .filter((e) => e.product)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8)
  }, [sales, products])

  const guestsByCountry = useMemo(() => {
    const agg = new Map<string, number>()
    for (const g of guests) {
      agg.set(g.country, (agg.get(g.country) ?? 0) + 1)
    }
    const total = guests.length || 1
    return [...agg.entries()]
      .map(([country, count]) => ({ country, count, percent: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count)
  }, [guests])

  const avgNights = useMemo(() => {
    const valid = reservations.filter((r) => r.checkIn && r.checkOut)
    if (!valid.length) return 0
    return Math.round((valid.reduce((s, r) => s + nightsBetween(r.checkIn, r.checkOut), 0) / valid.length) * 10) / 10
  }, [reservations])

  const occupancyByType = useMemo(
    () =>
      (occupancy?.byType ?? []).map((t) => ({
        type: t.type,
        rate: t.total ? Math.round((t.occupied / t.total) * 100) : 0,
        occupied: t.occupied,
        total: t.total,
      })),
    [occupancy]
  )

  const occupancyByStatus = useMemo(() => {
    const map = new Map((occupancy?.byStatus ?? []).map((s) => [s.status, s.count]))
    return ['libre', 'ocupada', 'mantenimiento', 'limpieza']
      .filter((status) => (map.get(status) ?? 0) > 0)
      .map((status) => ({ name: statusLabels[status] ?? status, count: map.get(status) ?? 0, fill: `var(--color-${status})` }))
  }, [occupancy])

  async function handleCreateExpense() {
    const amount = Number(expenseForm.amount)
    if (!expenseForm.date || Number.isNaN(amount) || amount < 0) {
      setExpenseError("Introduce un importe valido")
      return
    }
    setCreatingExpense(true)
    setExpenseError(null)
    try {
      await api.expenses.create({
        category: expenseForm.category,
        amount,
        date: expenseForm.date,
        note: expenseForm.note.trim() || undefined,
      })
      setExpenseDialogOpen(false)
      setExpenseForm({ category: "servicios", amount: "", date: new Date().toISOString().slice(0, 10), note: "" })
      fetchData()
    } catch (err) {
      setExpenseError(err instanceof Error ? err.message : "Error al crear el gasto")
    } finally {
      setCreatingExpense(false)
    }
  }

  async function handleDeleteExpense(id: string) {
    setDeletingExpense(id)
    setExpenseError(null)
    try {
      await api.expenses.remove(id)
      fetchData()
    } catch (err) {
      setExpenseError(err instanceof Error ? err.message : "Error al eliminar el gasto")
    } finally {
      setDeletingExpense(null)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Informes y KPIs</h1>
          <p className="text-muted-foreground text-sm">Metricas de rendimiento y analisis del hotel</p>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-5 pb-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-3 h-7 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Informes y KPIs</h1>
          <p className="text-muted-foreground text-sm">Metricas de rendimiento y analisis del hotel</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40 h-9">
              <Calendar className="mr-1 size-3" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Ultimo mes</SelectItem>
              <SelectItem value="3m">Ultimos 3 meses</SelectItem>
              <SelectItem value="6m">Ultimos 6 meses</SelectItem>
              <SelectItem value="1y">Ultimo ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="mr-1 size-3" />
            Exportar
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="mr-2 size-4" />
            Reintentar
          </Button>
        </div>
      )}

      {/* Top-level KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground font-medium">Ingresos Totales</p>
              <div className="flex size-7 items-center justify-center rounded-md bg-emerald-100">
                <Euro className="size-3.5 text-emerald-700" />
              </div>
            </div>
            <p className="text-xl font-bold text-foreground">{formatCurrency(totalRevenue)}</p>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="size-3 text-emerald-600" />
              <span className="text-xs text-muted-foreground">{invoices.length} facturas emitidas</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground font-medium">Beneficio Neto</p>
              <div className="flex size-7 items-center justify-center rounded-md bg-primary/10">
                <DollarSign className="size-3.5 text-primary" />
              </div>
            </div>
            <p className="text-xl font-bold text-foreground">{formatCurrency(netProfit)}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-muted-foreground">
                margen: {totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground font-medium">Ocupacion Media</p>
              <div className="flex size-7 items-center justify-center rounded-md bg-amber-100">
                <BedDouble className="size-3.5 text-amber-700" />
              </div>
            </div>
            <p className="text-xl font-bold text-foreground">{avgOccupancy}%</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-muted-foreground">
                {occupancy?.occupiedRooms ?? 0}/{occupancy?.totalRooms ?? rooms.length} habitaciones
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground font-medium">RevPAR</p>
              <div className="flex size-7 items-center justify-center rounded-md bg-sky-100">
                <Target className="size-3.5 text-sky-700" />
              </div>
            </div>
            <p className="text-xl font-bold text-foreground">{formatCurrency(revPerRoom)}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-muted-foreground">ingreso por habitacion</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={isAdmin ? "financial" : "occupancy"}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="financial" className="gap-1.5">
            <Euro className="size-3.5" />
            Financiero
          </TabsTrigger>
          <TabsTrigger value="occupancy" className="gap-1.5">
            <BedDouble className="size-3.5" />
            Ocupacion
          </TabsTrigger>
          <TabsTrigger value="catering" className="gap-1.5">
            <UtensilsCrossed className="size-3.5" />
            Catering
          </TabsTrigger>
          <TabsTrigger value="guests" className="gap-1.5">
            <Users className="size-3.5" />
            Huespedes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="mt-4 flex flex-col gap-6">
          {!isAdmin && (
            <div className="flex items-center gap-2 rounded-md border border-amber-300/40 bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              <ShieldAlert className="size-4 shrink-0" />
              Los datos financieros detallados solo estan disponibles para administradores.
            </div>
          )}
          {isAdmin && (
            <>
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-foreground">Ingresos vs Gastos</CardTitle>
                    <CardDescription>Comparativa mensual de finanzas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={revenueConfig} className="h-[280px] w-full">
                      <BarChart data={monthlyRevenue} barGap={4}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                        <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} />
                        <Bar dataKey="ingresos" fill="var(--color-ingresos)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="gastos" fill="var(--color-gastos)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-foreground">Ingresos por Tipo de Habitacion</CardTitle>
                    <CardDescription>Facturacion de alojamiento por categoria</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {revenueByRoomType.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Sin datos para este periodo</p>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {revenueByRoomType.map((item) => {
                          const maxRevenue = Math.max(...revenueByRoomType.map((r) => r.revenue))
                          return (
                            <div key={item.type} className="flex flex-col gap-1.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-foreground">{typeLabels[item.type] ?? item.type}</span>
                                  <Badge variant="secondary" className="text-[10px]">{item.reservations} reservas</Badge>
                                </div>
                                <span className="text-sm font-semibold text-foreground">{formatCurrency(item.revenue)}</span>
                              </div>
                              <Progress value={maxRevenue ? (item.revenue / maxRevenue) * 100 : 0} className="h-2" />
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-foreground">Resumen Financiero Mensual</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mes</TableHead>
                        <TableHead className="text-right">Ingresos</TableHead>
                        <TableHead className="text-right">Gastos</TableHead>
                        <TableHead className="text-right">Beneficio</TableHead>
                        <TableHead className="text-right">Margen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyRevenue.map((m) => {
                        const profit = m.ingresos - m.gastos
                        const margin = m.ingresos > 0 ? Math.round((profit / m.ingresos) * 100) : 0
                        return (
                          <TableRow key={m.month}>
                            <TableCell className="font-medium text-foreground">{m.month}</TableCell>
                            <TableCell className="text-right text-foreground">{formatCurrency(m.ingresos)}</TableCell>
                            <TableCell className="text-right text-muted-foreground">{formatCurrency(m.gastos)}</TableCell>
                            <TableCell className="text-right font-semibold text-emerald-700">{formatCurrency(profit)}</TableCell>
                            <TableCell className="text-right">
                              <Badge className="bg-emerald-100 text-emerald-800 border-0 text-xs">{margin}%</Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-foreground">Gastos Registrados</CardTitle>
                    <CardDescription>Desglose de gastos por concepto</CardDescription>
                  </div>
                  <Button size="sm" onClick={() => { setExpenseError(null); setExpenseDialogOpen(true) }}>
                    <Plus className="mr-1 size-4" />
                    Nuevo gasto
                  </Button>
                </CardHeader>
                <CardContent>
                  {expenseError && (
                    <div className="mb-3 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                      <AlertCircle className="mt-0.5 size-4 shrink-0" />
                      <span>{expenseError}</span>
                    </div>
                  )}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Concepto</TableHead>
                        <TableHead className="text-right">Importe</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell className="text-muted-foreground text-sm">{e.date}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize text-xs">{e.category}</Badge>
                          </TableCell>
                          <TableCell className="text-foreground">{e.note || "—"}</TableCell>
                          <TableCell className="text-right font-medium text-foreground">{formatCurrency(e.amount)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-destructive hover:text-destructive"
                              disabled={deletingExpense === e.id}
                              onClick={() => handleDeleteExpense(e.id)}
                            >
                              <Trash2 className="size-4" />
                              <span className="sr-only">Eliminar gasto</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {expenses.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            Sin gastos registrados
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="occupancy" className="mt-4 flex flex-col gap-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Ocupacion por Tipo</CardTitle>
                <CardDescription>Habitaciones ocupadas por categoria</CardDescription>
              </CardHeader>
              <CardContent>
                {occupancyByType.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin datos de ocupacion</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {occupancyByType.map((t) => (
                      <div key={t.type} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground capitalize">{typeLabels[t.type] ?? t.type}</span>
                          <span className="text-sm text-muted-foreground">{t.occupied}/{t.total} ({t.rate}%)</span>
                        </div>
                        <Progress value={t.rate} className="h-2" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Estado de Habitaciones</CardTitle>
                <CardDescription>Distribucion actual de la flota</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={statusConfig} className="h-[280px] w-full">
                  <BarChart data={occupancyByStatus}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {occupancyByStatus.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Room Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Rendimiento por Habitacion</CardTitle>
              <CardDescription>Reservas e ingresos estimados por habitacion</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Habitacion</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Tarifa</TableHead>
                    <TableHead>Reservas</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Ingresos Est.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms.slice(0, 10).map((room) => {
                    const roomRes = reservations.filter((r) => r.roomId === room.id && r.status !== 'cancelada')
                    const estRevenue = roomRes.reduce((s, r) => s + r.totalAmount, 0)
                    return (
                      <TableRow key={room.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <BedDouble className="size-3.5 text-muted-foreground" />
                            <span className="font-semibold text-foreground">{room.number}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs capitalize">{typeLabels[room.type] ?? room.type}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatCurrency(room.pricePerNight)}/n</TableCell>
                        <TableCell className="text-foreground">{roomRes.length}</TableCell>
                        <TableCell>
                          <Badge className={`text-xs border-0 ${room.status === 'ocupada' ? 'bg-emerald-100 text-emerald-800' : room.status === 'mantenimiento' ? 'bg-amber-100 text-amber-800' : room.status === 'limpieza' ? 'bg-sky-100 text-sky-800' : 'bg-muted text-muted-foreground'}`}>
                            {statusLabels[room.status] ?? room.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-foreground">{formatCurrency(estRevenue)}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="catering" className="mt-4 flex flex-col gap-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Ventas por Categoria</CardTitle>
                <CardDescription>Distribucion de ingresos de catering</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <ChartContainer config={pieConfig} className="h-[280px] w-full max-w-[300px]">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} />
                    <Pie data={cateringByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} strokeWidth={2}>
                      {cateringByCategory.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              </CardContent>
              <CardContent className="pt-0">
                <div className="flex flex-col gap-2">
                  {cateringByCategory.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-3 rounded-full" style={{ backgroundColor: cat.fill }} />
                        <span className="text-sm text-foreground capitalize">{cat.name}</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">{formatCurrency(cat.value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Ventas por Dia de la Semana</CardTitle>
                <CardDescription>Volumen de ventas acumulado por dia</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={salesConfig} className="h-[280px] w-full">
                  <BarChart data={dailySales}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v) => formatCurrency(v)} />
                    <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} />
                    <Bar dataKey="amount" fill="var(--color-amount)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Productos Mas Vendidos</CardTitle>
              <CardDescription>Ranking de productos por volumen de ventas</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Unidades Vendidas</TableHead>
                    <TableHead className="text-right">Ingreso Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map(({ product, qty, revenue }, i) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        {i < 3 ? (
                          <Badge className="bg-amber-100 text-amber-800 border-0 text-xs size-6 flex items-center justify-center">
                            {i + 1}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground ml-1.5">{i + 1}</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">{product.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">{product.category}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatCurrency(product.price)}</TableCell>
                      <TableCell className="text-foreground">{qty}</TableCell>
                      <TableCell className="text-right font-medium text-foreground">
                        {formatCurrency(revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {topProducts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Sin ventas registradas
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guests" className="mt-4 flex flex-col gap-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Huespedes por Pais</CardTitle>
                <CardDescription>Distribucion de la nacionalidad de los huespedes</CardDescription>
              </CardHeader>
              <CardContent>
                {guestsByCountry.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin huespedes registrados</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {guestsByCountry.slice(0, 6).map((c) => (
                      <div key={c.country} className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs w-8 justify-center shrink-0">{c.country}</Badge>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-foreground">{c.country}</span>
                            <span className="text-xs text-muted-foreground">{c.count} huespedes ({c.percent}%)</span>
                          </div>
                          <Progress value={c.percent} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Metricas de Huespedes</CardTitle>
                <CardDescription>Estadisticas clave del alojamiento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-md border p-4 text-center">
                    <Users className="size-5 text-muted-foreground mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground">{guests.length}</p>
                    <p className="text-xs text-muted-foreground">Total Huespedes</p>
                  </div>
                  <div className="rounded-md border p-4 text-center">
                    <BedDouble className="size-5 text-muted-foreground mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground">{rooms.length}</p>
                    <p className="text-xs text-muted-foreground">Habitaciones</p>
                  </div>
                  <div className="rounded-md border p-4 text-center">
                    <Star className="size-5 text-amber-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground">{avgNights}</p>
                    <p className="text-xs text-muted-foreground">Noches Promedio</p>
                  </div>
                  <div className="rounded-md border p-4 text-center">
                    <Receipt className="size-5 text-muted-foreground mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground">{invoices.length}</p>
                    <p className="text-xs text-muted-foreground">Facturas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reservations Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Reservas Recientes</CardTitle>
              <CardDescription>Reservas con huesped y habitacion</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Huesped</TableHead>
                    <TableHead>Pais</TableHead>
                    <TableHead>Habitacion</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservations
                    .filter((r) => r.status !== 'cancelada')
                    .slice(0, 10)
                    .map((res) => {
                      const guest = guests.find((g) => g.id === res.guestId)
                      const room = roomById.get(res.roomId)
                      return (
                        <TableRow key={res.id}>
                          <TableCell className="font-medium text-foreground">{guest?.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{guest?.country}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">Hab. {room?.number}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{res.checkIn}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{res.checkOut}</TableCell>
                          <TableCell>
                            <Badge className={`text-xs border-0 ${
                              res.status === "checkin" ? "bg-emerald-100 text-emerald-800" :
                              res.status === "confirmada" ? "bg-sky-100 text-sky-800" :
                              "bg-muted text-muted-foreground"
                            }`}>
                              {res.status === "checkin" ? "Check-in" : res.status === "confirmada" ? "Confirmada" : res.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium text-foreground">{formatCurrency(res.totalAmount)}</TableCell>
                        </TableRow>
                      )
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Expense Dialog */}
      <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Nuevo Gasto</DialogTitle>
            <DialogDescription>Registra un gasto del hotel</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="expense-category">Categoria</Label>
                <Select
                  value={expenseForm.category}
                  onValueChange={(v) => setExpenseForm({ ...expenseForm, category: v as Expense["category"] })}
                >
                  <SelectTrigger id="expense-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["mantenimiento", "limpieza", "servicios", "nominas", "otros"] as Expense["category"][]).map((c) => (
                      <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expense-date">Fecha</Label>
                <Input
                  id="expense-date"
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expense-amount">Importe</Label>
              <Input
                id="expense-amount"
                type="number"
                min="0"
                step="0.01"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expense-note">Concepto (opcional)</Label>
              <Input
                id="expense-note"
                value={expenseForm.note}
                onChange={(e) => setExpenseForm({ ...expenseForm, note: e.target.value })}
                placeholder="Ej. Reparacion climatizacion"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpenseDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateExpense} disabled={creatingExpense}>
              {creatingExpense ? "Guardando..." : "Guardar gasto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}