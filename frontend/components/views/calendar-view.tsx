"use client"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { rooms, reservations, guests, getGuestById, type RoomStatus } from "@/lib/store"
import { roomStatusConfig } from "@/lib/constants"

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

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function formatDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
}

export function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(1) // Feb = 1
  const [currentYear, setCurrentYear] = useState(2026)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCell, setSelectedCell] = useState<{ roomId: string; date: string } | null>(null)

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ]

  const reservationMap = useMemo(() => {
    const map: Record<string, { reservation: typeof reservations[0]; guest: ReturnType<typeof getGuestById> }> = {}
    reservations.forEach((res) => {
      const start = new Date(res.checkIn)
      const end = new Date(res.checkOut)
      const current = new Date(start)
      while (current < end) {
        const key = `${res.roomId}-${current.toISOString().split("T")[0]}`
        map[key] = { reservation: res, guest: getGuestById(res.guestId) }
        current.setDate(current.getDate() + 1)
      }
    })
    return map
  }, [])

  function handleCellClick(roomId: string, day: number) {
    const date = formatDate(currentYear, currentMonth, day)
    const key = `${roomId}-${date}`
    if (!reservationMap[key]) {
      setSelectedCell({ roomId, date })
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
              <Select>
                <SelectTrigger>
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
                <Input id="checkin" type="date" defaultValue={selectedCell?.date} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="checkout">Check-out</Label>
                <Input id="checkout" type="date" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="num-guests">Numero de Huespedes</Label>
              <Input id="num-guests" type="number" min="1" max="5" defaultValue="1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => setDialogOpen(false)}>
              <Plus className="mr-2 size-4" />
              Crear Reserva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
