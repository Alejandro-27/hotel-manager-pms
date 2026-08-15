"use client"

import { useState } from "react"
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
} from "lucide-react"
import { rooms, reservations, getGuestById, type Room, type RoomStatus } from "@/lib/store"
import { roomStatusConfig as statusConfig, roomTypeLabels as typeLabels } from "@/lib/constants"

export function RoomsView() {
  const [filterFloor, setFilterFloor] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [editRoom, setEditRoom] = useState<Room | null>(null)
  const [editStatus, setEditStatus] = useState<string>("")
  const [editPrice, setEditPrice] = useState<string>("")
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  const floors = [...new Set(rooms.map((r) => r.floor))].sort()

  const filteredRooms = rooms.filter((r) => {
    if (filterFloor !== "all" && r.floor !== Number(filterFloor)) return false
    if (filterType !== "all" && r.type !== filterType) return false
    if (filterStatus !== "all" && r.status !== filterStatus) return false
    return true
  })

  const statusCounts = {
    libre: rooms.filter((r) => r.status === "libre").length,
    ocupada: rooms.filter((r) => r.status === "ocupada").length,
    mantenimiento: rooms.filter((r) => r.status === "mantenimiento").length,
    limpieza: rooms.filter((r) => r.status === "limpieza").length,
  }

  function getOccupant(roomId: string) {
    const res = reservations.find((r) => r.roomId === roomId && r.status === "checkin")
    if (!res) return null
    return getGuestById(res.guestId)
  }

  function handleOpenEdit(room: Room) {
    setEditRoom(room)
    setEditStatus(room.status)
    setEditPrice(room.pricePerNight.toString())
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
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="doble">Doble</SelectItem>
                  <SelectItem value="suite">Suite</SelectItem>
                  <SelectItem value="familiar">Familiar</SelectItem>
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
                  <SelectItem value="libre">Libre</SelectItem>
                  <SelectItem value="ocupada">Ocupada</SelectItem>
                  <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                  <SelectItem value="limpieza">Limpieza</SelectItem>
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
              {filteredRooms.map((room) => {
                const config = statusConfig[room.status]
                const occupant = getOccupant(room.id)
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
                        <span className="text-sm">{room.pricePerNight.toFixed(2)}</span>
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
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="libre">Libre</SelectItem>
                      <SelectItem value="ocupada">Ocupada</SelectItem>
                      <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                      <SelectItem value="limpieza">Limpieza</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Tarifa por noche (EUR)</Label>
                  <Input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditRoom(null)}>Cancelar</Button>
                <Button onClick={() => setEditRoom(null)}>Guardar Cambios</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Room Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Nueva Habitacion</DialogTitle>
            <DialogDescription>Agrega una nueva habitacion al hotel</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Numero</Label>
                <Input placeholder="601" className="mt-1" />
              </div>
              <div>
                <Label className="text-sm">Planta</Label>
                <Input type="number" placeholder="6" className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Tipo</Label>
                <Select defaultValue="doble">
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="doble">Doble</SelectItem>
                    <SelectItem value="suite">Suite</SelectItem>
                    <SelectItem value="familiar">Familiar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Capacidad maxima</Label>
                <Input type="number" defaultValue={2} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-sm">Tarifa por noche (EUR)</Label>
              <Input type="number" placeholder="150" className="mt-1" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancelar</Button>
              <Button onClick={() => setAddDialogOpen(false)}>
                <Plus className="mr-1 size-4" />
                Crear Habitacion
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
