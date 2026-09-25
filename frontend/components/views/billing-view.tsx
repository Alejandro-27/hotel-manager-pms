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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Receipt,
  Eye,
  Printer,
  FileText,
  CircleDollarSign,
  User,
  BedDouble,
  CalendarDays,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { api } from "@/lib/api"
import { createPortal } from "react-dom"
import type { Invoice, Guest, Reservation, Room, Product } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { InvoiceVoucher } from "@/components/invoice-voucher"
import { invoiceStatusConfig } from "@/lib/constants"

export function BillingView() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [guestsData, setGuestsData] = useState<Guest[]>([])
  const [reservationsData, setReservationsData] = useState<Reservation[]>([])
  const [roomsData, setRoomsData] = useState<Room[]>([])
  const [productsData, setProductsData] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null)
  const [payInvoice, setPayInvoice] = useState<Invoice | null>(null)
  const [printRoot, setPrintRoot] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setPrintRoot(document.body)
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [inv, g, r, rm, p] = await Promise.all([
        api.invoices.get(),
        api.guests.get(),
        api.reservations.get(),
        api.rooms.get(),
        api.products.get(),
      ])
      setInvoices(inv)
      setGuestsData(g)
      setReservationsData(r)
      setRoomsData(rm)
      setProductsData(p)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar las facturas")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const guestById = useMemo(() => new Map(guestsData.map((g) => [g.id, g])), [guestsData])
  const roomById = useMemo(() => new Map(roomsData.map((r) => [r.id, r])), [roomsData])
  const reservationById = useMemo(() => new Map(reservationsData.map((r) => [r.id, r])), [reservationsData])
  const productById = useMemo(() => new Map(productsData.map((p) => [p.id, p])), [productsData])
  const productName = useCallback(
    (id: string) => productById.get(id)?.name,
    [productById]
  )

  const invoice = selectedInvoice ? invoices.find((i) => i.id === selectedInvoice) : null
  const invoiceGuest = invoice ? guestById.get(invoice.guestId) : null
  const invoiceReservation = invoice ? reservationById.get(invoice.reservationId) : null
  const invoiceRoom = invoiceReservation ? roomById.get(invoiceReservation.roomId) : null

  const totalPaid = useMemo(
    () => invoices.filter((i) => i.status === "pagada").reduce((sum, i) => sum + (i.subtotal - i.totalDue + i.advancePayment), 0),
    [invoices]
  )
  const totalPartial = useMemo(
    () => invoices.filter((i) => i.status === "parcial").reduce((sum, i) => sum + i.totalDue, 0),
    [invoices]
  )
  const totalPending = useMemo(
    () => invoices.filter((i) => i.status === "pendiente").reduce((sum, i) => sum + i.totalDue, 0),
    [invoices]
  )

  function handlePrint() {
    window.print()
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Facturacion y Pagos</h1>
        <p className="text-muted-foreground text-sm">Contabilidad y gestion de facturas</p>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-md bg-emerald-100">
                <CircleDollarSign className="size-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Cobrado</p>
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(totalPaid)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-md bg-amber-100">
                <FileText className="size-5 text-amber-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pagos Parciales</p>
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(totalPartial)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-md bg-red-100">
                <Receipt className="size-5 text-red-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendiente de Cobro</p>
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(totalPending)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading / Invoices Table */}
      {loading ? (
        <Card className="p-4">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-8 w-52" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-2/3" />
          </div>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Facturas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N Factura</TableHead>
                    <TableHead>Huesped</TableHead>
                    <TableHead>Habitacion</TableHead>
                    <TableHead>Subtotal</TableHead>
                    <TableHead>Anticipo</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => {
                    const guest = guestById.get(inv.guestId)
                    const reservation = reservationById.get(inv.reservationId)
                    const room = reservation ? roomById.get(reservation.roomId) : null
                    const style = invoiceStatusConfig[inv.status]
                    return (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono font-medium text-foreground">
                          {inv.id.toUpperCase()}
                        </TableCell>
                        <TableCell className="text-foreground">{guest?.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">Hab. {room?.number}</Badge>
                        </TableCell>
                        <TableCell className="text-foreground">{formatCurrency(inv.subtotal)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatCurrency(inv.advancePayment)}
                        </TableCell>
                        <TableCell className="font-semibold text-foreground">
                          {formatCurrency(inv.totalDue)}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${style.badgeClass} text-xs border-0`}>
                            {style.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedInvoice(inv.id)}
                          >
                            <Eye className="mr-1 size-3" />
                            Ver
                          </Button>
                          {inv.status !== "pagada" && inv.totalDue > 0 && (
                            <Button
                              size="sm"
                              className="ml-1"
                              onClick={() => {
                                setPayInvoice(inv)
                              }}
                            >
                              Cobrar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden voucher for printing (portal a body, fuera del Sheet) */}
      {invoice && printRoot
        ? createPortal(
            <div className="print-only">
              <InvoiceVoucher
                invoice={invoice}
                guest={invoiceGuest}
                reservation={invoiceReservation}
                room={invoiceRoom}
                productName={productName}
              />
            </div>,
            printRoot,
          )
        : null}

      {/* Invoice Detail Sheet */}
      <Sheet open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <SheetContent side="right" className="gap-0 p-0 sm:max-w-xl">
          {invoice && (
            <>
              <SheetHeader className="border-b px-6 py-5 pr-14">
                <SheetTitle className="text-foreground">Factura</SheetTitle>
                <SheetDescription>Documento de facturacion</SheetDescription>
              </SheetHeader>

              {/* On-screen document */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="flex flex-col gap-6">
                  {/* Brand + id header */}
                  <div className="overflow-hidden rounded-xl border bg-card">
                    <div className="h-1.5 bg-gradient-to-r from-[#1a1a2e] via-[#2563eb] to-[#93c5fd]" />
                    <div className="flex items-start justify-between gap-4 px-5 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-[#1a1a2e] text-lg font-black tracking-tight text-white">
                          H
                        </div>
                        <div>
                          <p className="text-base font-bold tracking-tight text-foreground">HotelManager</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">PMS & POS</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          Factura
                        </p>
                        <p className="mt-1 font-mono text-xs font-semibold text-foreground">
                          {invoice.id.toUpperCase()}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{invoice.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t bg-muted/40 px-5 py-3">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Estado de pago
                      </span>
                      <div
                        className={`inline-flex -rotate-2 items-center gap-1.5 rounded-md border-2 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${invoiceStatusConfig[invoice.status].stampClass}`}
                      >
                        {invoiceStatusConfig[invoice.status].icon}
                        {invoiceStatusConfig[invoice.status].label}
                      </div>
                    </div>
                  </div>

                  {/* Client / stay */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        <User className="size-3" />
                        Cliente
                      </p>
                      <p className="text-sm font-semibold text-foreground">{invoiceGuest?.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{invoiceGuest?.document}</p>
                      <p className="text-xs text-muted-foreground">{invoiceGuest?.email}</p>
                      {invoiceGuest?.phone ? (
                        <p className="text-xs text-muted-foreground">{invoiceGuest.phone}</p>
                      ) : null}
                    </div>
                    <div>
                      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        <BedDouble className="size-3" />
                        Estancia
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        Hab. {invoiceRoom?.number}{" "}
                        <span className="font-normal capitalize text-muted-foreground">— {invoiceRoom?.type}</span>
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays className="size-3" />
                        {invoiceReservation?.checkIn} a {invoiceReservation?.checkOut}
                      </p>
                    </div>
                  </div>

                  {/* Line items */}
                  <div className="overflow-hidden rounded-xl border bg-card">
                    <div className="border-b bg-muted/40 px-5 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Conceptos
                      </p>
                    </div>
                    <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 border-b px-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <span>Concepto</span>
                      <span className="text-right">Cant.</span>
                      <span className="text-right">Precio</span>
                      <span className="text-right">Total</span>
                    </div>
                    <div className="px-5">
                      <div className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center gap-2 border-b border-dashed py-3 text-sm">
                        <span className="font-medium text-foreground">
                          Alojamiento Hab. {invoiceRoom?.number}
                        </span>
                        <span className="text-right text-xs text-muted-foreground">
                          {invoice.roomNights.nights} noches
                        </span>
                        <span className="text-right text-xs text-muted-foreground">
                          {formatCurrency(invoice.roomNights.pricePerNight)}
                        </span>
                        <span className="text-right font-semibold tabular-nums text-foreground">
                          {formatCurrency(invoice.roomNights.nights * invoice.roomNights.pricePerNight)}
                        </span>
                      </div>
                      {invoice.cateringCharges.map((item, i) => (
                        <div
                          key={i}
                          className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center gap-2 border-b border-dashed py-3 text-sm last:border-b-0"
                        >
                          <span className="font-medium text-foreground">
                            {productName(item.productId) ?? "Producto"}
                          </span>
                          <span className="text-right text-xs text-muted-foreground">{item.quantity}</span>
                          <span className="text-right text-xs text-muted-foreground">
                            {formatCurrency(item.unitPrice)}
                          </span>
                          <span className="text-right font-semibold tabular-nums text-foreground">
                            {formatCurrency(item.quantity * item.unitPrice)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="rounded-xl border bg-card px-5 py-4">
                    <div className="flex items-center justify-between py-1">
                      <span className="text-sm text-muted-foreground">Subtotal</span>
                      <span className="text-sm tabular-nums text-foreground">
                        {formatCurrency(invoice.subtotal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-sm text-muted-foreground">IVA ({invoice.tax}%)</span>
                      <span className="text-sm tabular-nums text-foreground">
                        {formatCurrency(invoice.subtotal * (invoice.tax / 100))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-sm text-muted-foreground">Anticipo pagado</span>
                      <span className="text-sm font-medium tabular-nums text-emerald-700">
                        -{formatCurrency(invoice.advancePayment)}
                      </span>
                    </div>

                    <div className="mt-3 flex items-end justify-between gap-4 rounded-lg border-2 border-foreground/90 bg-muted/30 px-5 py-4">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                          {invoice.totalDue > 0 ? "Saldo pendiente" : "Total pagado"}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">Monto de esta factura</p>
                      </div>
                      <p
                        className={`text-3xl font-extrabold tracking-tight tabular-nums ${
                          invoice.totalDue > 0 ? "text-primary" : "text-emerald-600"
                        }`}
                      >
                        {formatCurrency(invoice.totalDue)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t px-6 py-4">
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="mr-1 size-3" />
                  Imprimir
                </Button>
                {invoice.status !== "pagada" && invoice.totalDue > 0 && (
                  <Button size="sm" onClick={() => setPayInvoice(invoice)}>
                    Registrar Pago
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Payment Dialog */}
      <PaymentDialog
        invoice={payInvoice}
        onClose={() => setPayInvoice(null)}
        onPaid={() => {
          setPayInvoice(null)
          setSelectedInvoice(null)
          fetchData()
        }}
      />
    </div>
  )
}

// ---------- Payment Dialog ----------

function PaymentDialog({
  invoice,
  onClose,
  onPaid,
}: {
  invoice: Invoice | null
  onClose: () => void
  onPaid: () => void
}) {
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("efectivo")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (invoice) {
      setAmount(String(invoice.totalDue))
      setPaymentMethod("efectivo")
      setError(null)
    }
  }, [invoice])

  async function handlePay() {
    const value = Number(amount)
    if (!invoice || !value || value <= 0) {
      setError("Ingresa un monto valido")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await api.invoices.pay(invoice.id, { amount: value, paymentMethod: paymentMethod as Reservation['paymentMethod'] })
      onPaid()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar el pago")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={!!invoice} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground">Registrar Pago</DialogTitle>
          <DialogDescription>
            {invoice && `Factura ${invoice.id.toUpperCase()} — Saldo pendiente: ${formatCurrency(invoice.totalDue)}`}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="pay-amount">Monto</Label>
            <Input
              id="pay-amount"
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pay-method">Metodo de pago</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="pay-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="tarjeta">Tarjeta</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handlePay} disabled={submitting}>
            {submitting ? "Registrando..." : "Confirmar Pago"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}