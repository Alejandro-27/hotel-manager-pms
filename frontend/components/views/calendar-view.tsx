"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertCircle, ChevronLeft, ChevronRight, Plus, RefreshCw } from "lucide-react"
import { api } from "@/lib/api"
import { roomStatusConfig } from "@/lib/constants"
import type { Room, Reservation, Guest, RoomStatus } from "@/lib/types"

const statusColors: Record<RoomStatus, string> = {
  libre: roomStatusConfig.libre.className,
  ocupada: roomStatusConfig.ocupada.className,
  mantenimiento: roomStatusConfig.mantenimiento.className,
  limpieza: roomStatusConfig.limpieza.className,
}

const statusLabels: Record<RoomStatus, string> = {
  libre: "Libre",
  ocupada: "Ocupada",
  mantenimiento: "Mant.",
  limpieza: "Limpieza",
}

const paymentMethods = ["efectivo", "tarjeta", "transferencia"] as const

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function formatDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
}

export function CalendarView() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear())

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCell, setSelectedCell] = useState<{ roomId: string; date: string } | null>(null)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [formGuestId, setFormGuestId] = useState("")
  const [formCheckIn, setFormCheckIn] = useState("")
  const [formCheckOut, setFormCheckOut] = useState("")
  const [formGuests, setFormGuests] = useState("1")
  const [formPayment, setFormPayment] = useState<(typeof paymentMethods)[number]>("efectivo")

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [roomsData, reservationsData, guestsData] = await Promise.all([
        api.rooms.get(),
        api.reservations.get(),
        api.guests.get(),
      ])
      setRooms(roomsData)
      setReservations(reservationsData)
      setGuests(guestsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar el calendario")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ]

  const guestById = useMemo(() => new Map(guests.map((g) => [g.id, g])), [guests])

  const reservationMap = useMemo(() => {
    const map: Record<string, { reservation: Reservation; guest: Guest | undefined }> = {}
    reservations.forEach((res) => {
      const start = new Date(res.checkIn)
      const end = new Date(res.checkOut)
      const current = new Date(start)
      while (current < end) {
        const key = `${res.roomId}-${current.toISOString().split("T")[0]}`
        map[key] = { reservation: res, guest: guestById.get(res.guestId) }
        current.setDate(current.getDate() + 1)
      }
    })
    return map
  }, [reservations, guestById])

  function handleCellClick(roomId: string, day: number) {
    const date = formatDate(currentYear, currentMonth, day)
    const key = `${roomId}-${date}`
    if (!reservationMap[key]) {
      setSelectedCell({ roomId, date })
      setFormGuestId(guests[0]?.id ?? "")
      setFormCheckIn(date)
      setFormCheckOut(date)
      setFormGuests("1")
      setFormPayment("efectivo")
      setCreateError(null)
      setDialogOpen(true)
    }
  }

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  async function handleCreateReservation() {
    if (!selectedCell) return
    setCreating(true)
    setCreateError(null)
    try {
      await api.reservations.create({
        guestId: formGuestId,
        roomId: selectedCell.roomId,
        checkIn: formCheckIn,
        checkOut: formCheckOut,
        guests: Number(formGuests),
        paymentMethod: formPayment,
      })
      setDialogOpen(false)
      fetchData()
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Error al crear la reserva")
    } finally {
      setCreating(false)
    }
  }

  const sortedRooms = [...rooms].sort((a, b) => a.number.localeCompare(b.number))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Calendario de Reservas</h1>
          <p className="text-muted-foreground text-sm">Vista global tipo Gantt de la ocupacion</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm font-medium min-w-[140px] text-center text-foreground">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {(Object.keys(statusColors) as RoomStatus[]).map((status) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={`size-3 rounded-sm ${statusColors[status].split(" ")[0]}`} />
            <span className="text-xs text-muted-foreground">{statusLabels[status]}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="size-3 rounded-sm bg-primary" />
          <span className="text-xs text-muted-foreground">Reservada</span>
        </div>
      </div>

      {/* Error state */}
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

      {/* Loading state */}
      {loading ? (
        <Card className="overflow-hidden p-4">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-1/2" />
          </div>
        </Card>
      ) : (
        <>
          {/* Gantt Grid */}
          <Card className="overflow-hidden">
            <ScrollArea className="w-full">
              <div className="min-w-[1200px]">
                {/* Header Row */}
                <div className="flex border-b bg-muted/50">
                  <div className="w-[100px] shrink-0 border-r px-3 py-2">
                    <span className="text-xs font-semibold text-muted-foreground">Habitacion</span>
                  </div>
                  {days.map((day) => {
                    const dateStr = formatDate(currentYear, currentMonth, day)
                    const today = new Date()
                    const isToday = dateStr === formatDate(today.getFullYear(), today.getMonth(), today.getDate())
                    const dayOfWeek = new Date(currentYear, currentMonth, day).getDay()
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                    return (
                      <div
                        key={day}
                        className={`flex-1 min-w-[38px] border-r px-0.5 py-2 text-center ${isToday ? "bg-primary/10" : isWeekend ? "bg-muted/80" : ""}`}
                      >
                        <span className={`text-[10px] block ${isToday ? "font-bold text-primary" : "text-muted-foreground"}`}>
                          {["D", "L", "M", "X", "J", "V", "S"][dayOfWeek]}
                        </span>
                        <span className={`text-xs font-medium ${isToday ? "text-primary" : "text-foreground"}`}>{day}</span>
                      </div>
                    )
                  })}
                </div>

                {/* Room Rows */}
                {sortedRooms.map((room) => (
                  <div key={room.id} className="flex border-b last:border-b-0 hover:bg-muted/30">
                    <div className="w-[100px] shrink-0 border-r px-3 py-1.5 flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] px-1 py-0 ${statusColors[room.status]}`}>
                        {room.number}
                      </Badge>
                    </div>
                    {days.map((day) => {
                      const dateStr = formatDate(currentYear, currentMonth, day)
                      const key = `${room.id}-${dateStr}`
                      const entry = reservationMap[key]
                      const today = new Date()
                      const isToday = dateStr === formatDate(today.getFullYear(), today.getMonth(), today.getDate())

                      return (
                        <div
                          key={day}
                          className={`flex-1 min-w-[38px] border-r h-[36px] cursor-pointer transition-colors ${
                            entry
                              ? "bg-primary/20 hover:bg-primary/30"
                              : isToday
                                ? "bg-primary/5 hover:bg-primary/10"
                                : "hover:bg-muted/50"
                          }`}
                          onClick={() => handleCellClick(room.id, day)}
                          title={
                            entry
                              ? `${entry.guest?.name} - ${entry.reservation.status}`
                              : `Disponible - Click para reservar`
                          }
                        >
                          {entry && (
                            <div className="h-full flex items-center justify-center">
                              <div className="h-[20px] w-full mx-0.5 rounded-sm bg-primary/60 flex items-center justify-center">
                                <span className="text-[8px] text-primary-foreground font-medium truncate px-1">
                                  {entry.guest?.name?.split(" ")[0]}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </Card>
        </>
      )}

      {/* New Reservation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Nueva Reserva</DialogTitle>
            <DialogDescription>
              {selectedCell && (
                <>
                  Habitacion {rooms.find(r => r.id === selectedCell.roomId)?.number} - {selectedCell.date}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="guest-select">Huesped</Label>
              <Select value={formGuestId} onValueChange={setFormGuestId}>
                <SelectTrigger id="guest-select">
                  <SelectValue placeholder="Seleccionar huesped" />
                </SelectTrigger>
                <SelectContent>
                  {guests.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="checkin">Check-in</Label>
                <Input id="checkin" type="date" value={formCheckIn} onChange={(e) => setFormCheckIn(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="checkout">Check-out</Label>
                <Input id="checkout" type="date" value={formCheckOut} onChange={(e) => setFormCheckOut(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="num-guests">Numero de Huespedes</Label>
                <Input id="num-guests" type="number" min="1" max="5" value={formGuests} onChange={(e) => setFormGuests(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="payment-method">Metodo de pago</Label>
                <Select value={formPayment} onValueChange={(v) => setFormPayment(v as (typeof paymentMethods)[number])}>
                  <SelectTrigger id="payment-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method} value={method}>{method}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {createError && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateReservation} disabled={creating || !formGuestId}>
              {creating ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creando...
                </span>
              ) : (
                <>
                  <Plus className="mr-2 size-4" />
                  Crear Reserva
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}