"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Search,
  Plus,
  UserCheck,
  UserMinus,
  AlertTriangle,
  ChevronRight,
} from "lucide-react"
import {
  guests,
  reservations,
  rooms,
  type ReservationStatus,
} from "@/lib/store"

const statusStyles: Record<ReservationStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  confirmada: { label: "Confirmada", variant: "secondary" },
  checkin: { label: "Check-in", variant: "default" },
  checkout: { label: "Check-out", variant: "outline" },
  cancelada: { label: "Cancelada", variant: "destructive" },
}

export function GuestsView() {
  const [search, setSearch] = useState("")
  const [filterCountry, setFilterCountry] = useState("all")
  const [bookingOpen, setBookingOpen] = useState(false)
  const [bookingStep, setBookingStep] = useState(1)

  const countries = useMemo(() => {
    return [...new Set(guests.map((g) => g.country))].sort()
  }, [])

  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      const matchSearch =
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.document.toLowerCase().includes(search.toLowerCase())
      const matchCountry = filterCountry === "all" || g.country === filterCountry
      return matchSearch && matchCountry
    })
  }, [search, filterCountry])

  const guestReservations = useMemo(() => {
    const map: Record<string, typeof reservations> = {}
    reservations.forEach((r) => {
      if (!map[r.guestId]) map[r.guestId] = []
      map[r.guestId].push(r)
    })
    return map
  }, [])

  function openNewBooking() {
    setBookingStep(1)
    setBookingOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Huespedes y Reservas</h1>
          <p className="text-muted-foreground text-sm">Gestiona los huespedes y sus reservas</p>
        </div>
        <Button onClick={openNewBooking}>
          <Plus className="mr-2 size-4" />
          Nueva Reserva
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o documento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterCountry} onValueChange={setFilterCountry}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Pais" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los paises</SelectItem>
                {countries.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Guests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">
            Huespedes ({filteredGuests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Pais</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Reservas</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGuests.map((guest) => {
                const gRes = guestReservations[guest.id] || []
                const activeRes = gRes.find((r) => r.status === "checkin")
                return (
                  <TableRow key={guest.id}>
                    <TableCell className="font-medium text-foreground">{guest.name}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{guest.document}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{guest.country}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{guest.email}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {gRes.map((r) => (
                          <Badge key={r.id} variant={statusStyles[r.status].variant} className="text-[10px]">
                            {statusStyles[r.status].label}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {activeRes ? (
                          <Button variant="outline" size="sm">
                            <UserMinus className="mr-1 size-3" />
                            Check-out
                          </Button>
                        ) : gRes.some((r) => r.status === "confirmada") ? (
                          <Button variant="outline" size="sm">
                            <UserCheck className="mr-1 size-3" />
                            Check-in
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Multi-step Booking Dialog */}
      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">Nueva Reserva</DialogTitle>
            <DialogDescription>
              Paso {bookingStep} de 3 {bookingStep === 1 && "- Datos del Huesped"}
              {bookingStep === 2 && "- Seleccion de Habitacion"}
              {bookingStep === 3 && "- Pago"}
            </DialogDescription>
          </DialogHeader>

          {/* Progress */}
          <div className="flex items-center gap-1">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-1.5 flex-1 rounded-full ${step <= bookingStep ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>

          {bookingStep === 1 && (
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Nombre completo</Label>
                  <Input placeholder="Nombre y apellidos" />
                </div>
                <div className="grid gap-2">
                  <Label>Documento</Label>
                  <Input placeholder="DNI/Pasaporte" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Pais</Label>
                  <Input placeholder="Pais de origen" />
                </div>
                <div className="grid gap-2">
                  <Label>Telefono</Label>
                  <Input placeholder="+34..." />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input type="email" placeholder="correo@email.com" />
              </div>
            </div>
          )}

          {bookingStep === 2 && (
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Check-in</Label>
                  <Input type="date" />
                </div>
                <div className="grid gap-2">
                  <Label>Check-out</Label>
                  <Input type="date" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Numero de huespedes</Label>
                <Input type="number" min="1" max="5" defaultValue="1" />
              </div>
              <Separator />
              <Label>Habitaciones disponibles</Label>
              <div className="grid gap-2 max-h-[200px] overflow-y-auto">
                {rooms
                  .filter((r) => r.status === "libre")
                  .map((room) => (
                    <div
                      key={room.id}
                      className="flex items-center justify-between rounded-md border p-3 cursor-pointer hover:bg-accent transition-colors"
                    >
                      <div>
                        <span className="font-medium text-foreground">Hab. {room.number}</span>
                        <span className="text-sm text-muted-foreground ml-2 capitalize">{room.type}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">Max: {room.maxCapacity}</span>
                        <span className="font-semibold text-foreground">{room.pricePerNight} EUR/noche</span>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {bookingStep === 3 && (
            <div className="grid gap-4 py-2">
              <div className="rounded-md border p-4 bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Subtotal estimado</span>
                  <span className="font-semibold text-foreground">480,00 EUR</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Anticipo (30%)</span>
                  <span className="font-semibold text-primary">144,00 EUR</span>
                </div>
                <Separator className="my-2" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">A pagar ahora</span>
                  <span className="text-lg font-bold text-primary">144,00 EUR</span>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Metodo de pago</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar metodo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3">
                <AlertTriangle className="size-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Politica de cancelacion</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Cancelaciones con menos de 24 horas de antelacion seran penalizadas con el 100% del anticipo.
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {bookingStep > 1 && (
              <Button variant="outline" onClick={() => setBookingStep(bookingStep - 1)}>
                Atras
              </Button>
            )}
            {bookingStep < 3 ? (
              <Button onClick={() => setBookingStep(bookingStep + 1)}>
                Siguiente
                <ChevronRight className="ml-1 size-4" />
              </Button>
            ) : (
              <Button onClick={() => setBookingOpen(false)}>
                Confirmar Reserva
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
