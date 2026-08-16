"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Hotel,
  Globe,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Bell,
  Shield,
  Palette,
  Save,
  Users,
  Receipt,
  Clock,
} from "lucide-react"

export function SettingsView() {
  const [hotelName, setHotelName] = useState("Gran Hotel Central")
  const [hotelEmail, setHotelEmail] = useState("info@granhotelcentral.com")
  const [hotelPhone, setHotelPhone] = useState("+34 912 345 678")
  const [hotelAddress, setHotelAddress] = useState("Calle Mayor 42, 28013 Madrid, Espana")
  const [hotelWebsite, setHotelWebsite] = useState("www.granhotelcentral.com")
  const [hotelStars, setHotelStars] = useState("4")
  const [currency, setCurrency] = useState("EUR")
  const [timezone, setTimezone] = useState("Europe/Madrid")
  const [language, setLanguage] = useState("es")
  const [taxRate, setTaxRate] = useState("10")
  const [advancePercent, setAdvancePercent] = useState("30")
  const [cancellationHours, setCancellationHours] = useState("24")
  const [checkInTime, setCheckInTime] = useState("14:00")
  const [checkOutTime, setCheckOutTime] = useState("12:00")

  const [notifEmail, setNotifEmail] = useState(true)
  const [notifNewBooking, setNotifNewBooking] = useState(true)
  const [notifCheckIn, setNotifCheckIn] = useState(true)
  const [notifLowStock, setNotifLowStock] = useState(true)
  const [notifPayment, setNotifPayment] = useState(false)

  const [twoFactor, setTwoFactor] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState("30")

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Configuracion</h1>
        <p className="text-muted-foreground text-sm">Ajustes generales del sistema hotelero</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="general" className="gap-1.5">
            <Hotel className="size-3.5" />
            General
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-1.5">
            <Receipt className="size-3.5" />
            Facturacion
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5">
            <Bell className="size-3.5" />
            Notificaciones
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5">
            <Shield className="size-3.5" />
            Seguridad
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-1.5">
            <Palette className="size-3.5" />
            Apariencia
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="mt-4 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Hotel className="size-4" />
                Datos del Hotel
              </CardTitle>
              <CardDescription>Informacion basica del establecimiento</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-sm">Nombre del Hotel</Label>
                  <Input value={hotelName} onChange={(e) => setHotelName(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">Categoria</Label>
                  <Select value={hotelStars} onValueChange={setHotelStars}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Estrella</SelectItem>
                      <SelectItem value="2">2 Estrellas</SelectItem>
                      <SelectItem value="3">3 Estrellas</SelectItem>
                      <SelectItem value="4">4 Estrellas</SelectItem>
                      <SelectItem value="5">5 Estrellas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-sm flex items-center gap-1.5">
                    <Mail className="size-3" />
                    Email
                  </Label>
                  <Input value={hotelEmail} onChange={(e) => setHotelEmail(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm flex items-center gap-1.5">
                    <Phone className="size-3" />
                    Telefono
                  </Label>
                  <Input value={hotelPhone} onChange={(e) => setHotelPhone(e.target.value)} className="mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-sm flex items-center gap-1.5">
                  <MapPin className="size-3" />
                  Direccion
                </Label>
                <Textarea value={hotelAddress} onChange={(e) => setHotelAddress(e.target.value)} className="mt-1 min-h-12" />
              </div>
              <div>
                <Label className="text-sm flex items-center gap-1.5">
                  <Globe className="size-3" />
                  Sitio Web
                </Label>
                <Input value={hotelWebsite} onChange={(e) => setHotelWebsite(e.target.value)} className="mt-1" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Globe className="size-4" />
                Regional
              </CardTitle>
              <CardDescription>Moneda, idioma y zona horaria</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label className="text-sm">Moneda</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="USD">USD - Dolar</SelectItem>
                      <SelectItem value="GBP">GBP - Libra</SelectItem>
                      <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Idioma</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Espanol</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">Francais</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Zona Horaria</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Madrid">Europe/Madrid (CET)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                      <SelectItem value="America/New_York">America/New York (EST)</SelectItem>
                      <SelectItem value="America/Mexico_City">America/Mexico City (CST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Clock className="size-4" />
                Horarios
              </CardTitle>
              <CardDescription>Horas de check-in y check-out</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-sm">Hora de Check-in</Label>
                  <Input type="time" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">Hora de Check-out</Label>
                  <Input type="time" value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)} className="mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button>
              <Save className="mr-1 size-4" />
              Guardar Cambios
            </Button>
          </div>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="mt-4 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Receipt className="size-4" />
                Politicas de Facturacion
              </CardTitle>
              <CardDescription>Impuestos, anticipos y cancelacion</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label className="text-sm">IVA (%)</Label>
                  <Input type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className="mt-1" />
                  <p className="text-[11px] text-muted-foreground mt-1">Porcentaje de impuesto aplicado a facturas</p>
                </div>
                <div>
                  <Label className="text-sm">Anticipo (%)</Label>
                  <Input type="number" value={advancePercent} onChange={(e) => setAdvancePercent(e.target.value)} className="mt-1" />
                  <p className="text-[11px] text-muted-foreground mt-1">Porcentaje requerido al reservar</p>
                </div>
                <div>
                  <Label className="text-sm">Cancelacion gratuita (horas)</Label>
                  <Input type="number" value={cancellationHours} onChange={(e) => setCancellationHours(e.target.value)} className="mt-1" />
                  <p className="text-[11px] text-muted-foreground mt-1">Limite para cancelar sin penalizacion</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <CreditCard className="size-4" />
                Metodos de Pago Aceptados
              </CardTitle>
              <CardDescription>Metodos habilitados en el TPV y recepcion</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex items-center gap-3">
                    <CreditCard className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Tarjeta de Credito/Debito</p>
                      <p className="text-xs text-muted-foreground">Visa, Mastercard, Amex</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex items-center gap-3">
                    <Receipt className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Efectivo</p>
                      <p className="text-xs text-muted-foreground">Pagos en efectivo en recepcion</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex items-center gap-3">
                    <Globe className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Transferencia Bancaria</p>
                      <p className="text-xs text-muted-foreground">IBAN: ES12 1234 5678 9012 3456 7890</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex items-center gap-3">
                    <Users className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Cargo a Habitacion</p>
                      <p className="text-xs text-muted-foreground">Solo para huespedes con check-in activo</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button>
              <Save className="mr-1 size-4" />
              Guardar Cambios
            </Button>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-4 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Bell className="size-4" />
                Preferencias de Notificaciones
              </CardTitle>
              <CardDescription>Controla que notificaciones recibir</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Notificaciones por Email</p>
                    <p className="text-xs text-muted-foreground">Recibir alertas en el correo del hotel</p>
                  </div>
                  <Switch checked={notifEmail} onCheckedChange={setNotifEmail} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Nuevas Reservas</p>
                    <p className="text-xs text-muted-foreground">Alerta al recibir una nueva reserva</p>
                  </div>
                  <Switch checked={notifNewBooking} onCheckedChange={setNotifNewBooking} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Check-in/Check-out</p>
                    <p className="text-xs text-muted-foreground">Recordatorios de entradas y salidas del dia</p>
                  </div>
                  <Switch checked={notifCheckIn} onCheckedChange={setNotifCheckIn} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Stock Bajo</p>
                    <p className="text-xs text-muted-foreground">Alerta cuando el inventario este bajo</p>
                  </div>
                  <Switch checked={notifLowStock} onCheckedChange={setNotifLowStock} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Pagos Recibidos</p>
                    <p className="text-xs text-muted-foreground">Notificacion de pagos completados</p>
                  </div>
                  <Switch checked={notifPayment} onCheckedChange={setNotifPayment} />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button>
              <Save className="mr-1 size-4" />
              Guardar Cambios
            </Button>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-4 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Shield className="size-4" />
                Seguridad de la Cuenta
              </CardTitle>
              <CardDescription>Proteccion y acceso al sistema</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between rounded-md border p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Autenticacion de Dos Factores</p>
                  <p className="text-xs text-muted-foreground">Requiere codigo adicional al iniciar sesion</p>
                </div>
                <div className="flex items-center gap-2">
                  {twoFactor && <Badge className="bg-emerald-100 text-emerald-800 border-0 text-xs">Activo</Badge>}
                  <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
                </div>
              </div>

              <div>
                <Label className="text-sm">Tiempo de expiracion de sesion (minutos)</Label>
                <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
                  <SelectTrigger className="mt-1 w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="120">2 horas</SelectItem>
                    <SelectItem value="480">8 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-foreground mb-2">Cambiar Contrasena</p>
                <div className="grid gap-3 max-w-sm">
                  <div>
                    <Label className="text-sm">Contrasena actual</Label>
                    <Input type="password" placeholder="********" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm">Nueva contrasena</Label>
                    <Input type="password" placeholder="********" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm">Confirmar nueva contrasena</Label>
                    <Input type="password" placeholder="********" className="mt-1" />
                  </div>
                  <Button variant="outline" className="w-fit">Actualizar Contrasena</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Users className="size-4" />
                Roles y Permisos
              </CardTitle>
              <CardDescription>Niveles de acceso del personal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {[
                  { role: "Administrador", desc: "Acceso total a todos los modulos y configuraciones", perms: ["Dashboard", "Calendario", "Huespedes", "TPV", "Facturacion", "Habitaciones", "Configuracion", "Informes"] },
                  { role: "Recepcionista", desc: "Gestiona reservas, check-in/out y huespedes", perms: ["Dashboard", "Calendario", "Huespedes", "Facturacion"] },
                  { role: "Catering", desc: "Acceso al TPV e inventario de productos", perms: ["TPV", "Dashboard"] },
                  { role: "Contabilidad", desc: "Visualiza facturacion e informes financieros", perms: ["Facturacion", "Informes", "Dashboard"] },
                ].map((item) => (
                  <div key={item.role} className="rounded-md border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.role}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <Button variant="outline" size="sm">Editar</Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {item.perms.map((p) => (
                        <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="mt-4 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Palette className="size-4" />
                Aspecto del Sistema
              </CardTitle>
              <CardDescription>Personaliza la apariencia visual</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div>
                <Label className="text-sm mb-2 block">Tema</Label>
                <div className="grid grid-cols-3 gap-3 max-w-md">
                  <button className="flex flex-col items-center gap-2 rounded-md border-2 border-primary p-3">
                    <div className="size-8 rounded-md bg-background border" />
                    <span className="text-xs font-medium text-foreground">Claro</span>
                  </button>
                  <button className="flex flex-col items-center gap-2 rounded-md border p-3 hover:border-primary/50 transition-colors">
                    <div className="size-8 rounded-md bg-foreground" />
                    <span className="text-xs font-medium text-foreground">Oscuro</span>
                  </button>
                  <button className="flex flex-col items-center gap-2 rounded-md border p-3 hover:border-primary/50 transition-colors">
                    <div className="size-8 rounded-md bg-gradient-to-br from-background to-foreground" />
                    <span className="text-xs font-medium text-foreground">Sistema</span>
                  </button>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-sm mb-2 block">Color Primario</Label>
                <div className="flex gap-3 max-w-md">
                  {[
                    { name: "Azul Marino", className: "bg-primary", active: true },
                    { name: "Esmeralda", className: "bg-emerald-700", active: false },
                    { name: "Indigo", className: "bg-indigo-700", active: false },
                    { name: "Slate", className: "bg-slate-700", active: false },
                    { name: "Terracota", className: "bg-orange-800", active: false },
                  ].map((color) => (
                    <button
                      key={color.name}
                      className={`flex flex-col items-center gap-1.5 ${color.active ? "opacity-100" : "opacity-50 hover:opacity-75"} transition-opacity`}
                    >
                      <div className={`size-8 rounded-full ${color.className} ${color.active ? "ring-2 ring-offset-2 ring-primary" : ""}`} />
                      <span className="text-[10px] text-muted-foreground">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-sm mb-2 block">Densidad del Interfaz</Label>
                <div className="grid grid-cols-3 gap-3 max-w-md">
                  <button className="rounded-md border p-3 text-center hover:border-primary/50 transition-colors">
                    <span className="text-xs text-muted-foreground">Compacto</span>
                  </button>
                  <button className="rounded-md border-2 border-primary p-3 text-center">
                    <span className="text-xs font-medium text-foreground">Normal</span>
                  </button>
                  <button className="rounded-md border p-3 text-center hover:border-primary/50 transition-colors">
                    <span className="text-xs text-muted-foreground">Espacioso</span>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button>
              <Save className="mr-1 size-4" />
              Guardar Cambios
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
