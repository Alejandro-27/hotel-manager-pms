"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  TrendingUp,
  BedDouble,
  Users,
  Euro,
  DollarSign,
  Calendar,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  UtensilsCrossed,
  Clock,
  Star,
  Target,
} from "lucide-react"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Line,
  LineChart,
  Area,
  AreaChart,
  Pie,
  PieChart,
  Cell,
} from "recharts"
import {
  rooms,
  reservations,
  guests,
  products,
  monthlyRevenueData,
  getGuestById,
  getRoomById,
} from "@/lib/store"
import { formatCurrency } from "@/lib/utils"

// --- Report Data ---
const occupancyByMonth = [
  { month: "Sep", rate: 62 },
  { month: "Oct", rate: 71 },
  { month: "Nov", rate: 55 },
  { month: "Dic", rate: 85 },
  { month: "Ene", rate: 48 },
  { month: "Feb", rate: 30 },
]

const revenueByRoomType = [
  { type: "Individual", revenue: 8500, reservations: 15 },
  { type: "Doble", revenue: 18400, reservations: 22 },
  { type: "Suite", revenue: 32000, reservations: 12 },
  { type: "Familiar", revenue: 21600, reservations: 10 },
]

const cateringByCategory = [
  { name: "Desayunos", value: 12400, fill: "var(--chart-1)" },
  { name: "Snacks", value: 6800, fill: "var(--chart-2)" },
  { name: "Bebidas", value: 9200, fill: "var(--chart-3)" },
]

const guestsByCountry = [
  { country: "ES", name: "Espana", guests: 32, percent: 40 },
  { country: "FR", name: "Francia", guests: 14, percent: 18 },
  { country: "US", name: "Estados Unidos", guests: 12, percent: 15 },
  { country: "DE", name: "Alemania", guests: 10, percent: 13 },
  { country: "IT", name: "Italia", guests: 7, percent: 9 },
  { country: "JP", name: "Japon", guests: 4, percent: 5 },
]

const dailySales = [
  { day: "Lun", amount: 340 },
  { day: "Mar", amount: 280 },
  { day: "Mie", amount: 520 },
  { day: "Jue", amount: 410 },
  { day: "Vie", amount: 680 },
  { day: "Sab", amount: 890 },
  { day: "Dom", amount: 720 },
]

const avgStayData = [
  { month: "Sep", nights: 3.2 },
  { month: "Oct", nights: 2.8 },
  { month: "Nov", nights: 3.5 },
  { month: "Dic", nights: 4.1 },
  { month: "Ene", nights: 2.6 },
  { month: "Feb", nights: 3.8 },
]

const occupancyConfig = {
  rate: { label: "Ocupacion %", color: "var(--chart-1)" },
} satisfies ChartConfig

const revenueConfig = {
  ingresos: { label: "Ingresos", color: "var(--chart-1)" },
  gastos: { label: "Gastos", color: "var(--chart-2)" },
} satisfies ChartConfig

const salesConfig = {
  amount: { label: "Ventas", color: "var(--chart-3)" },
} satisfies ChartConfig

const stayConfig = {
  nights: { label: "Noches", color: "var(--chart-4)" },
} satisfies ChartConfig

const pieConfig = {
  Desayunos: { label: "Desayunos", color: "var(--chart-1)" },
  Snacks: { label: "Snacks", color: "var(--chart-2)" },
  Bebidas: { label: "Bebidas", color: "var(--chart-3)" },
} satisfies ChartConfig

export function ReportsView() {
  const [period, setPeriod] = useState("6m")

  const totalRevenue = monthlyRevenueData.reduce((s, m) => s + m.ingresos, 0)
  const totalExpenses = monthlyRevenueData.reduce((s, m) => s + m.gastos, 0)
  const netProfit = totalRevenue - totalExpenses
  const avgOccupancy = Math.round(occupancyByMonth.reduce((s, m) => s + m.rate, 0) / occupancyByMonth.length)
  const totalGuests = guests.length
  const avgRevPerRoom = Math.round(totalRevenue / rooms.length)

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
              <span className="text-xs text-emerald-600 font-medium">+12.5%</span>
              <span className="text-xs text-muted-foreground">vs periodo anterior</span>
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
              <ArrowUpRight className="size-3 text-emerald-600" />
              <span className="text-xs text-emerald-600 font-medium">+8.3%</span>
              <span className="text-xs text-muted-foreground">margen: {Math.round((netProfit / totalRevenue) * 100)}%</span>
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
              <ArrowDownRight className="size-3 text-red-500" />
              <span className="text-xs text-red-500 font-medium">-3.2%</span>
              <span className="text-xs text-muted-foreground">vs periodo anterior</span>
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
            <p className="text-xl font-bold text-foreground">{formatCurrency(avgRevPerRoom)}</p>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="size-3 text-emerald-600" />
              <span className="text-xs text-emerald-600 font-medium">+5.1%</span>
              <span className="text-xs text-muted-foreground">por habitacion</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="financial">
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

        {/* Financial Tab */}
        <TabsContent value="financial" className="mt-4 flex flex-col gap-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Ingresos vs Gastos</CardTitle>
                <CardDescription>Comparativa mensual de finanzas</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={revenueConfig} className="h-[280px] w-full">
                  <BarChart data={monthlyRevenueData} barGap={4}>
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
                <CardDescription>Desglose de facturacion por categoria</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  {revenueByRoomType.map((item) => {
                    const maxRevenue = Math.max(...revenueByRoomType.map((r) => r.revenue))
                    return (
                      <div key={item.type} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{item.type}</span>
                            <Badge variant="secondary" className="text-[10px]">{item.reservations} reservas</Badge>
                          </div>
                          <span className="text-sm font-semibold text-foreground">{formatCurrency(item.revenue)}</span>
                        </div>
                        <Progress value={(item.revenue / maxRevenue) * 100} className="h-2" />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Summary Table */}
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
                  {monthlyRevenueData.map((m) => {
                    const profit = m.ingresos - m.gastos
                    const margin = Math.round((profit / m.ingresos) * 100)
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
        </TabsContent>

        {/* Occupancy Tab */}
        <TabsContent value="occupancy" className="mt-4 flex flex-col gap-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Evolucion de la Ocupacion</CardTitle>
                <CardDescription>Porcentaje mensual de ocupacion</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={occupancyConfig} className="h-[280px] w-full">
                  <AreaChart data={occupancyByMonth}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                    <ChartTooltip content={<ChartTooltipContent formatter={(value) => `${value}%`} />} />
                    <defs>
                      <linearGradient id="fillOcc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-rate)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-rate)" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="rate" fill="url(#fillOcc)" stroke="var(--color-rate)" strokeWidth={2} />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Estancia Media</CardTitle>
                <CardDescription>Promedio de noches por reserva</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={stayConfig} className="h-[280px] w-full">
                  <LineChart data={avgStayData}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} domain={[0, 5]} />
                    <ChartTooltip content={<ChartTooltipContent formatter={(value) => `${value} noches`} />} />
                    <Line type="monotone" dataKey="nights" stroke="var(--color-nights)" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Room Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Rendimiento por Habitacion</CardTitle>
              <CardDescription>Ocupacion y ingresos por habitacion (top 10)</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Habitacion</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Tarifa</TableHead>
                    <TableHead>Reservas</TableHead>
                    <TableHead>Ocupacion</TableHead>
                    <TableHead className="text-right">Ingresos Est.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms.slice(0, 10).map((room) => {
                    const roomRes = reservations.filter((r) => r.roomId === room.id)
                    const occupancy = Math.min(100, roomRes.length * 20)
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
                          <Badge variant="outline" className="text-xs capitalize">{room.type}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatCurrency(room.pricePerNight)}/n</TableCell>
                        <TableCell className="text-foreground">{roomRes.length}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={occupancy} className="h-1.5 w-16" />
                            <span className="text-xs text-muted-foreground">{occupancy}%</span>
                          </div>
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

        {/* Catering Tab */}
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
                        <span className="text-sm text-foreground">{cat.name}</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">{formatCurrency(cat.value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Ventas Diarias de la Semana</CardTitle>
                <CardDescription>Volumen de ventas por dia</CardDescription>
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
                  {products.slice(0, 8).map((product, i) => {
                    const unitsSold = [38, 32, 28, 25, 22, 18, 15, 12][i] ?? 10
                    return (
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
                        <TableCell className="text-foreground">{unitsSold}</TableCell>
                        <TableCell className="text-right font-medium text-foreground">
                          {formatCurrency(product.price * unitsSold)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Guests Tab */}
        <TabsContent value="guests" className="mt-4 flex flex-col gap-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Huespedes por Pais</CardTitle>
                <CardDescription>Distribucion de la nacionalidad de los huespedes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {guestsByCountry.map((c) => (
                    <div key={c.country} className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs w-8 justify-center shrink-0">{c.country}</Badge>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-foreground">{c.name}</span>
                          <span className="text-xs text-muted-foreground">{c.guests} huespedes ({c.percent}%)</span>
                        </div>
                        <Progress value={c.percent} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Metricas de Huespedes</CardTitle>
                <CardDescription>Estadisticas clave sobre huespedes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-md border p-4 text-center">
                    <Users className="size-5 text-muted-foreground mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground">{totalGuests}</p>
                    <p className="text-xs text-muted-foreground">Total Huespedes</p>
                  </div>
                  <div className="rounded-md border p-4 text-center">
                    <Star className="size-5 text-amber-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground">4.6</p>
                    <p className="text-xs text-muted-foreground">Valoracion Media</p>
                  </div>
                  <div className="rounded-md border p-4 text-center">
                    <Clock className="size-5 text-muted-foreground mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground">3.4</p>
                    <p className="text-xs text-muted-foreground">Noches Promedio</p>
                  </div>
                  <div className="rounded-md border p-4 text-center">
                    <TrendingUp className="size-5 text-emerald-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground">22%</p>
                    <p className="text-xs text-muted-foreground">Tasa de Repeticion</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Guests Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Huespedes Recientes</CardTitle>
              <CardDescription>Ultimos huespedes registrados con reserva activa</CardDescription>
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
                  {reservations.map((res) => {
                    const guest = getGuestById(res.guestId)
                    const room = getRoomById(res.roomId)
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
    </div>
  )
}
