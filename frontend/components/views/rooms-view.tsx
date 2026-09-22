"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  BedDouble,
  Plus,
  Pencil,
  Euro,
  Building2,
  Filter,
  Users,
  AlertTriangle,
  RefreshCw,
} from "lucide-react"
import { api } from "@/lib/api"
import { roomStatusConfig as statusConfig, roomTypeLabels as typeLabels } from "@/lib/constants"
import { formatCurrency } from "@/lib/utils"
import type { Room, RoomStatus, Reservation, Guest } from "@/lib/types"

interface NewRoomForm {
  number: string
  floor: string
  type: Room["type"]
  maxCapacity: string
  pricePerNight: string
}

const emptyForm: NewRoomForm = { number: "", floor: "1", type: "doble", maxCapacity: "2", pricePerNight: "" }

export function RoomsView() {
  const [filterFloor, setFilterFloor] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [rooms, setRooms] = useState<Room[]>([])
  const [activeReservations, setActiveReservations] = useState<Reservation[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [editRoom, setEditRoom] = useState<Room | null>(null)
  const [editStatus, setEditStatus] = useState<RoomStatus>("libre")
  const [editPrice, setEditPrice] = useState<string>("")
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newRoom, setNewRoom] = useState<NewRoomForm>(emptyForm)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      api.rooms.get(),
      api.reservations.get({ status: "checkin" }),
      api.guests.get(),
    ])
      .then(([r, res, g]) => {
        setRooms(r)
        setActiveReservations(res)
        setGuests(g)
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar habitaciones"))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const guestMap = useMemo(() => new Map(guests.map((g) => [g.id, g])), [guests])

  const floors = useMemo(() => [...new Set(rooms.map((r) => r.floor))].sort(), [rooms])

  const filteredRooms = useMemo(() => rooms.filter((r) => {
    if (filterFloor !== "all" && r.floor !== Number(filterFloor)) return false
    if (filterType !== "all" && r.type !== filterType) return false
    if (filterStatus !== "all" && r.status !== filterStatus) return false
    return true
  }), [rooms, filterFloor, filterType, filterStatus])

  const statusCounts = useMemo(() => {
    const counts: Record<RoomStatus, number> = { libre: 0, ocupada: 0, mantenimiento: 0, limpieza: 0 }
    rooms.forEach((r) => { counts[r.status] = (counts[r.status] ?? 0) + 1 })
    return counts
  }, [rooms])

  const occupantByRoom = useMemo(() => {
    const map = new Map<string, Guest>()
    activeReservations.forEach((r) => {
      if (!map.has(r.roomId)) {
        const guest = guestMap.get(r.guestId)
        if (guest) map.set(r.roomId, guest)
      }
    })
    return map
  }, [activeReservations, guestMap])

  function handleOpenEdit(room: Room) {
    setEditRoom(room)
    setEditStatus(room.status)
    setEditPrice(room.pricePerNight.toString())
  }

  async function handleSaveEdit() {
    if (!editRoom) return
    setSaving(true)
    setError(null)
    try {
      const price = Number(editPrice)
      if (Number.isFinite(price) && price !== editRoom.pricePerNight) {
        await api.rooms.update(editRoom.id, { pricePerNight: price })
      }
      if (editStatus !== editRoom.status) {
        await api.rooms.updateStatus(editRoom.id, editStatus)
      }
      setEditRoom(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar habitacion")
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateRoom() {
    setSaving(true)
    setError(null)
    try {
      await api.rooms.create({
        number: newRoom.number,
        floor: Number(newRoom.floor),
        type: newRoom.type,
        maxCapacity: Number(newRoom.maxCapacity),
        pricePerNight: Number(newRoom.pricePerNight),
      })
      setAddDialogOpen(false)
      setNewRoom(emptyForm)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear habitacion")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-60" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-72" />
      </div>
    )
  }

  if (error && rooms.length === 0) {
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Gestion de Habitaciones</h1>
          <p className="text-muted-foreground text-sm">Administra habitaciones, estados y tarifas</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-1 size-4" />
          Nueva Habitacion
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Status Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(Object.keys(statusConfig) as RoomStatus[]).map((status) => {
          const config = statusConfig[status]
          return (
            <Card
              key={status}
              className={`cursor-pointer transition-all ${filterStatus === status ? "ring-2 ring-primary" : ""}`}
              onClick={() => setFilterStatus(filterStatus === status ? "all" : status)}
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`flex size-9 items-center justify-center rounded-md ${config.className}`}>
                    {config.icon}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{config.label}</p>
                    <p className="text-xl font-bold text-foreground">{statusCounts[status]}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-foreground text-base">
            <Filter className="size-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="w-40">
              <Label className="text-xs text-muted-foreground mb-1 block">Planta</Label>
              <Select value={filterFloor} onValueChange={setFilterFloor}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {floors.map((f) => (
                    <SelectItem key={f} value={f.toString()}>Planta {f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Label className="text-xs text-muted-foreground mb-1 block">Tipo</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {(Object.keys(typeLabels) as Room["type"][]).map((t) => (
                    <SelectItem key={t} value={t}>{typeLabels[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Label className="text-xs text-muted-foreground mb-1 block">Estado</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {(Object.keys(statusConfig) as RoomStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(filterFloor !== "all" || filterType !== "all" || filterStatus !== "all") && (
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setFilterFloor("all"); setFilterType("all"); setFilterStatus("all") }}
                >
                  Limpiar filtros
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rooms Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">
            Habitaciones ({filteredRooms.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Habitacion</TableHead>
                  <TableHead>Planta</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Capacidad</TableHead>
                  <TableHead>Tarifa/Noche</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Huesped Actual</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRooms.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-sm text-muted-foreground">
                      No hay habitaciones que coincidan con los filtros
                    </TableCell>
                  </TableRow>
                )}
                {filteredRooms.map((room) => {
                  const config = statusConfig[room.status]
                  const occupant = occupantByRoom.get(room.id)
                  return (
                    <TableRow key={room.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                            <BedDouble className="size-4 text-muted-foreground" />
                          </div>
                          <span className="font-semibold text-foreground">{room.number}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Building2 className="size-3" />
                          <span className="text-sm">Planta {room.floor}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">
                          {typeLabels[room.type]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="size-3" />
                          <span className="text-sm">{room.maxCapacity}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-foreground font-medium">
                          <Euro className="size-3" />
                          <span className="text-sm">{formatCurrency(room.pricePerNight)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${config.className} text-xs border-0 gap-1`}>
                          {config.icon}
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {occupant ? (
                          <span className="text-sm text-foreground">{occupant.name}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">--</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleOpenEdit(room)}>
                          <Pencil className="mr-1 size-3" />
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Room Dialog */}
      <Dialog open={!!editRoom} onOpenChange={() => setEditRoom(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Editar Habitacion {editRoom?.number}</DialogTitle>
            <DialogDescription>Modifica el estado y la tarifa de la habitacion</DialogDescription>
          </DialogHeader>
          {editRoom && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4 rounded-md border p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Tipo</p>
                  <p className="text-sm font-medium text-foreground capitalize">{typeLabels[editRoom.type]}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Capacidad</p>
                  <p className="text-sm font-medium text-foreground">{editRoom.maxCapacity} personas</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Planta</p>
                  <p className="text-sm font-medium text-foreground">Planta {editRoom.floor}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">ID</p>
                  <p className="text-sm font-mono text-muted-foreground">{editRoom.id}</p>
                </div>
              </div>

              <div className="grid gap-3">
                <div>
                  <Label className="text-sm">Estado</Label>
                  <Select value={editStatus} onValueChange={(v) => setEditStatus(v as RoomStatus)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(statusConfig) as RoomStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Tarifa por noche</Label>
                  <Input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditRoom(null)} disabled={saving}>Cancelar</Button>
                <Button onClick={handleSaveEdit} disabled={saving}>
                  {saving ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Room Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) setNewRoom(emptyForm) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Nueva Habitacion</DialogTitle>
            <DialogDescription>Agrega una nueva habitacion al hotel</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Numero</Label>
                <Input
                  placeholder="601"
                  className="mt-1"
                  value={newRoom.number}
                  onChange={(e) => setNewRoom({ ...newRoom, number: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-sm">Planta</Label>
                <Input
                  type="number"
                  placeholder="6"
                  className="mt-1"
                  value={newRoom.floor}
                  onChange={(e) => setNewRoom({ ...newRoom, floor: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Tipo</Label>
                <Select value={newRoom.type} onValueChange={(v) => setNewRoom({ ...newRoom, type: v as Room["type"] })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(typeLabels) as Room["type"][]).map((t) => (
                      <SelectItem key={t} value={t}>{typeLabels[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Capacidad maxima</Label>
                <Input
                  type="number"
                  className="mt-1"
                  value={newRoom.maxCapacity}
                  onChange={(e) => setNewRoom({ ...newRoom, maxCapacity: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label className="text-sm">Tarifa por noche</Label>
              <Input
                type="number"
                placeholder="150"
                className="mt-1"
                value={newRoom.pricePerNight}
                onChange={(e) => setNewRoom({ ...newRoom, pricePerNight: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)} disabled={saving}>Cancelar</Button>
              <Button onClick={handleCreateRoom} disabled={saving}>
                {saving ? "Creando..." : (<><Plus className="mr-1 size-4" /> Crear Habitacion</>)}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}