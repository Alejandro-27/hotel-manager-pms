"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { AlertTriangle, ChevronRight, UserCheck, AlertCircle } from "lucide-react"
import { api } from "@/lib/api"
import type { Guest, Room } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

const paymentMethods = ["efectivo", "tarjeta", "transferencia"] as const

type GuestForm = {
  name: string
  document: string
  country: string
  phone: string
  email: string
}

function nightsBetween(checkIn: string, checkOut: string) {
  const start = new Date(checkIn)
  const end = new Date(checkOut)
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000))
}

export function BookingWizard({
  open,
  onOpenChange,
  rooms,
  guests,
  onComplete,
  onError,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  rooms: Room[]
  guests: Guest[]
  onComplete: () => void
  onError: (msg: string | null) => void
}) {
  const [step, setStep] = useState(1)
  const [guestForm, setGuestForm] = useState<GuestForm>({ name: "", document: "", country: "", phone: "", email: "" })
  const [selectedRoomId, setSelectedRoomId] = useState("")
  const [checkIn, setCheckIn] = useState("")
  const [checkOut, setCheckOut] = useState("")
  const [numGuests, setNumGuests] = useState("1")
  const [paymentMethod, setPaymentMethod] = useState<(typeof paymentMethods)[number]>("efectivo")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const matchingGuest = useMemo(() => {
    const doc = guestForm.document.trim().toLowerCase()
    if (!doc) return undefined
    return guests.find((g) => g.document.trim().toLowerCase() === doc)
  }, [guests, guestForm.document])

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId)
  const nights = nightsBetween(checkIn, checkOut)
  const subtotal = selectedRoom ? selectedRoom.pricePerNight * nights : 0
  const advance = Math.round(subtotal * 0.3)

  const availableRooms = useMemo(() => {
    return rooms
      .filter((r) => r.status === "libre")
      .filter((r) => r.maxCapacity >= (Number(numGuests) || 1))
      .sort((a, b) => a.number.localeCompare(b.number))
  }, [rooms, numGuests])

  function reset() {
    setStep(1)
    setGuestForm({ name: "", document: "", country: "", phone: "", email: "" })
    setSelectedRoomId("")
    setCheckIn("")
    setCheckOut("")
    setNumGuests("1")
    setPaymentMethod("efectivo")
    setError(null)
  }

  function handleClose(open: boolean) {
    if (!open) {
      reset()
      onOpenChange(false)
    }
  }

  function nextStep() {
    setError(null)
    if (step === 1) {
      if (!matchingGuest) {
        if (!guestForm.name.trim() || !guestForm.document.trim() || !guestForm.email.trim()) {
          setError("Completa nombre, documento y email del huesped")
          return
        }
        if (guestForm.country && guestForm.country.length !== 2) {
          setError("El pais debe ser codigo ISO de 2 letras (ej. ES)")
          return
        }
      }
      setStep(2)
      return
    }
    if (step === 2) {
      if (!selectedRoomId) {
        setError("Selecciona una habitacion")
        return
      }
      if (!checkIn || !checkOut) {
        setError("Selecciona check-in y check-out")
        return
      }
      if (nights <= 0) {
        setError("El check-out debe ser posterior al check-in")
        return
      }
      setStep(3)
    }
  }

  async function confirm() {
    setSubmitting(true)
    setError(null)
    try {
      let guestId: string
      if (matchingGuest) {
        guestId = matchingGuest.id
      } else {
        const created = await api.guests.create({
          name: guestForm.name.trim(),
          document: guestForm.document.trim(),
          country: guestForm.country.trim() || "XX",
          email: guestForm.email.trim(),
          phone: guestForm.phone.trim() || "000000",
        })
        guestId = created.id
      }

      await api.reservations.create({
        guestId,
        roomId: selectedRoomId,
        checkIn,
        checkOut,
        guests: Number(numGuests) || 1,
        paymentMethod,
        advancePayment: advance,
      })

      onError(null)
      handleClose(false)
      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la reserva")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground">Nueva Reserva</DialogTitle>
          <DialogDescription>
            Paso {step} de 3 {step === 1 && "- Datos del Huesped"}
            {step === 2 && "- Seleccion de Habitacion"}
            {step === 3 && "- Pago"}
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>

        {/* Step 1 - Guest data */}
        {step === 1 && (
          <div className="grid gap-4 py-2">
            {matchingGuest && (
              <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm text-foreground">
                <UserCheck className="size-4 text-primary mt-0.5 shrink-0" />
                <span>
                  Huesped existente: <strong>{matchingGuest.name}</strong> — no se creara una cuenta nueva.
                </span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Nombre completo</Label>
                <Input
                  placeholder="Nombre y apellidos"
                  value={guestForm.name}
                  onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Documento</Label>
                <Input
                  placeholder="DNI/Pasaporte"
                  value={guestForm.document}
                  onChange={(e) => setGuestForm({ ...guestForm, document: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Pais (ISO)</Label>
                <Input
                  placeholder="ES"
                  maxLength={2}
                  value={guestForm.country}
                  onChange={(e) => setGuestForm({ ...guestForm, country: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Telefono</Label>
                <Input
                  placeholder="+34..."
                  value={guestForm.phone}
                  onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="correo@email.com"
                value={guestForm.email}
                onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Step 2 - Room selection */}
        {step === 2 && (
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Check-in</Label>
                <Input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Check-out</Label>
                <Input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Numero de huespedes</Label>
              <Input
                type="number"
                min="1"
                max="5"
                value={numGuests}
                onChange={(e) => setNumGuests(e.target.value)}
              />
            </div>
            <Separator />
            <Label>Habitaciones disponibles</Label>
            <div className="grid gap-2 max-h-[220px] overflow-y-auto">
              {availableRooms.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay habitaciones libres para esa capacidad.</p>
              ) : (
                availableRooms.map((room) => (
                  <div
                    key={room.id}
                    className={`flex items-center justify-between rounded-md border p-3 cursor-pointer transition-colors ${
                      selectedRoomId === room.id
                        ? "border-primary bg-primary/10"
                        : "hover:bg-accent"
                    }`}
                    onClick={() => setSelectedRoomId(room.id)}
                  >
                    <div>
                      <span className="font-medium text-foreground">Hab. {room.number}</span>
                      <span className="text-sm text-muted-foreground ml-2 capitalize">{room.type}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">Max: {room.maxCapacity}</span>
                      <span className="font-semibold text-foreground">{formatCurrency(room.pricePerNight)}/noche</span>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Step 3 - Payment */}
        {step === 3 && (
          <div className="grid gap-4 py-2">
            <div className="rounded-md border p-4 bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  Subtotal ({nights} noche{nights !== 1 ? "s" : ""} x {formatCurrency(selectedRoom?.pricePerNight ?? 0)})
                </span>
                <span className="font-semibold text-foreground">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Anticipo (30%)</span>
                <span className="font-semibold text-primary">{formatCurrency(advance)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">A pagar ahora</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(advance)}</span>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Metodo de pago</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as (typeof paymentMethods)[number])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>{method}</SelectItem>
                  ))}
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

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => { setError(null); setStep(step - 1) }}>
              Atras
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={nextStep} disabled={submitting}>
              Siguiente
              <ChevronRight className="ml-1 size-4" />
            </Button>
          ) : (
            <Button onClick={confirm} disabled={submitting}>
              {submitting ? "Creando reserva..." : "Confirmar Reserva"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}