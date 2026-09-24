"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
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
import {
  Search,
  Plus,
  UserCheck,
  UserMinus,
  Pencil,
  AlertCircle,
  RefreshCw,
  XCircle,
} from "lucide-react"
import { api } from "@/lib/api"
import { BookingWizard } from "@/components/views/booking-wizard"
import type { Guest, Reservation, Room, ReservationStatus } from "@/lib/types"

const statusStyles: Record<ReservationStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  confirmada: { label: "Confirmada", variant: "secondary" },
  checkin: { label: "Check-in", variant: "default" },
  checkout: { label: "Check-out", variant: "outline" },
  cancelada: { label: "Cancelada", variant: "destructive" },
}

export function GuestsView() {
  const [allGuests, setAllGuests] = useState<Guest[]>([])
  const [guestsData, setGuestsData] = useState<Guest[]>([])
  const [reservationsData, setReservationsData] = useState<Reservation[]>([])
  const [roomsData, setRoomsData] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)

  const [search, setSearch] = useState("")
  const [filterCountry, setFilterCountry] = useState("all")

  const [editGuest, setEditGuest] = useState<Guest | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const [bookingOpen, setBookingOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [g, r, rm] = await Promise.all([
        api.guests.get(),
        api.reservations.get(),
        api.rooms.get(),
      ])
      setAllGuests(g)
      setGuestsData(g)
      setReservationsData(r)
      setRoomsData(rm)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar los huespedes")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const term = search.trim()
    if (term.length < 2) {
      setGuestsData(allGuests)
      setSearching(false)
      return
    }
    setSearching(true)
    const handler = setTimeout(() => {
      api.guests
        .get(term)
        .then((results) => {
          setGuestsData(results)
          setSearching(false)
        })
        .catch(() => setSearching(false))
    }, 300)
    return () => clearTimeout(handler)
  }, [search, allGuests])

  const countries = useMemo(() => {
    return [...new Set(allGuests.map((g) => g.country))].sort()
  }, [allGuests])

  const filteredGuests = useMemo(() => {
    return guestsData.filter((g) => {
      const matchSearch =
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.document.toLowerCase().includes(search.toLowerCase())
      const matchCountry = filterCountry === "all" || g.country === filterCountry
      return matchSearch && matchCountry
    })
  }, [guestsData, search, filterCountry])

  const guestReservations = useMemo(() => {
    const map: Record<string, Reservation[]> = {}
    reservationsData.forEach((r) => {
      if (!map[r.guestId]) map[r.guestId] = []
      map[r.guestId].push(r)
    })
    return map
  }, [reservationsData])

  async function handleCheckin(id: string) {
    setActionError(null)
    try {
      await api.reservations.checkin(id)
      fetchData()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error en check-in")
    }
  }

  async function handleCheckout(id: string) {
    setActionError(null)
    try {
      await api.reservations.checkout(id)
      fetchData()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error en check-out")
    }
  }

  async function handleCancelReservation(id: string) {
    setActionError(null)
    try {
      await api.reservations.cancel(id)
      fetchData()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Error al cancelar la reserva")
    }
  }

  async function handleSaveEdit() {
    if (!editGuest) return
    setSavingEdit(true)
    setEditError(null)
    try {
      await api.guests.update(editGuest.id, {
        name: editGuest.name,
        document: editGuest.document,
        country: editGuest.country,
        email: editGuest.email,
        phone: editGuest.phone,
      })
      setEditGuest(null)
      fetchData()
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Error al actualizar el huesped")
    } finally {
      setSavingEdit(false)
    }
  }

  function openNewBooking() {
    setActionError(null)
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

      {actionError && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

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

      {/* Error state */}
      {error && guestsData.length === 0 && (
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
        <Card className="p-4">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />
          </div>
        </Card>
      ) : (
        <>
          {/* Guests Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                Huespedes ({filteredGuests.length})
                {searching && (
                  <svg className="animate-spin h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
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
                    const pendingRes = gRes.find((r) => r.status === "confirmada")
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
                            {activeRes && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCheckout(activeRes.id)}
                              >
                                <UserMinus className="mr-1 size-3" />
                                Check-out
                              </Button>
                            )}
                            {!activeRes && pendingRes && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCheckin(pendingRes.id)}
                              >
                                <UserCheck className="mr-1 size-3" />
                                Check-in
                              </Button>
                            )}
                            {!activeRes && pendingRes && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleCancelReservation(pendingRes.id)}
                              >
                                <XCircle className="mr-1 size-3" />
                                Cancelar
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditGuest(guest)
                                setEditError(null)
                              }}
                            >
                              <Pencil className="size-4" />
                              <span className="sr-only">Editar {guest.name}</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Edit Guest Dialog */}
      <Dialog open={!!editGuest} onOpenChange={(open) => !open && setEditGuest(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">Editar Huesped</DialogTitle>
            <DialogDescription>Actualiza los datos del huesped</DialogDescription>
          </DialogHeader>
          {editGuest && (
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Nombre completo</Label>
                  <Input
                    value={editGuest.name}
                    onChange={(e) => setEditGuest({ ...editGuest, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Documento</Label>
                  <Input
                    value={editGuest.document}
                    onChange={(e) => setEditGuest({ ...editGuest, document: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Pais (ISO 3166)</Label>
                  <Input
                    maxLength={2}
                    value={editGuest.country}
                    onChange={(e) => setEditGuest({ ...editGuest, country: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Telefono</Label>
                  <Input
                    value={editGuest.phone}
                    onChange={(e) => setEditGuest({ ...editGuest, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editGuest.email}
                  onChange={(e) => setEditGuest({ ...editGuest, email: e.target.value })}
                />
              </div>
              {editError && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditGuest(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={savingEdit}>
              {savingEdit ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Multi-step Booking Dialog */}
      <BookingWizard
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        rooms={roomsData}
        guests={allGuests}
        onComplete={fetchData}
        onError={setActionError}
      />
    </div>
  )
}
