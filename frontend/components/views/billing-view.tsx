"use client"

import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import type { Invoice, Guest, Reservation, Room, Product, InvoiceStatus } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { InvoiceVoucher } from "@/components/invoice-voucher"

const statusStyles: Record<InvoiceStatus, { label: string; className: string }> = {
  pagada: { label: "Pagada", className: "bg-emerald-100 text-emerald-800" },
  parcial: { label: "Parcial", className: "bg-amber-100 text-amber-800" },
  pendiente: { label: "Pendiente", className: "bg-red-100 text-red-800" },
}

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
  const voucherRef = useRef<HTMLDivElement>(null)

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
                    const style = statusStyles[inv.status]
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
                          <Badge className={`${style.className} text-xs border-0`}>
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

      {/* Invoice Detail Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader className="no-print">
            <DialogTitle className="text-foreground">Factura {invoice?.id.toUpperCase()}</DialogTitle>
            <DialogDescription>
              Detalle completo de la factura
            </DialogDescription>
          </DialogHeader>

          {invoice && (
            <>
              {/* Hidden voucher for printing only */}
              <div className="print-only">
                <InvoiceVoucher
                  ref={voucherRef}
                  invoice={invoice}
                  guest={invoiceGuest}
                  reservation={invoiceReservation}
                  room={invoiceRoom}
                  productName={productName}
                />
              </div>

              {/* On-screen system view */}
              <div className="no-print flex flex-col gap-4">
                <ScrollArea className="max-h-[60vh] pr-4">
                  <div className="flex flex-col gap-4">
                    {/* Header Info */}
                    <div className="grid grid-cols-2 gap-4 rounded-md border p-4">
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="size-3" />
                          Huesped
                        </p>
                        <p className="text-sm font-medium text-foreground">{invoiceGuest?.name}</p>
                        <p className="text-xs text-muted-foreground">{invoiceGuest?.document}</p>
                        <p className="text-xs text-muted-foreground">{invoiceGuest?.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                          <CalendarDays className="size-3" />
                          Fecha
                        </p>
                        <p className="text-sm font-medium text-foreground">{invoice.date}</p>
                        <Badge className={`mt-1 ${statusStyles[invoice.status].className} border-0 text-xs`}>
                          {statusStyles[invoice.status].label}
                        </Badge>
                      </div>
                    </div>

                    {/* Room info */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BedDouble className="size-4" />
                      Hab. {invoiceRoom?.number} — {invoiceRoom?.type} ({invoiceReservation?.checkIn} a {invoiceReservation?.checkOut})
                    </div>

                    {/* Line Items */}
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Concepto</TableHead>
                            <TableHead className="text-right">Cantidad</TableHead>
                            <TableHead className="text-right">Precio</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="text-foreground">
                              Alojamiento Hab. {invoiceRoom?.number}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {invoice.roomNights.nights} noches
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {formatCurrency(invoice.roomNights.pricePerNight)}
                            </TableCell>
                            <TableCell className="text-right font-medium text-foreground">
                              {formatCurrency(invoice.roomNights.nights * invoice.roomNights.pricePerNight)}
                            </TableCell>
                          </TableRow>
                          {invoice.cateringCharges.map((item, i) => (
                            <TableRow key={i}>
                              <TableCell className="text-foreground">
                                {productName(item.productId) ?? "Producto"}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {item.quantity}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {formatCurrency(item.unitPrice)}
                              </TableCell>
                              <TableCell className="text-right font-medium text-foreground">
                                {formatCurrency(item.quantity * item.unitPrice)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Totals */}
                    <div className="rounded-md border p-4 bg-muted/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">Subtotal</span>
                        <span className="text-sm text-foreground">{formatCurrency(invoice.subtotal)}</span>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">IVA ({invoice.tax}%)</span>
                        <span className="text-sm text-foreground">
                          {formatCurrency(invoice.subtotal * (invoice.tax / 100))}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">Anticipo pagado</span>
                        <span className="text-sm text-emerald-700">
                          -{formatCurrency(invoice.advancePayment)}
                        </span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex items-center justify-between">
                        <span className="text-base font-semibold text-foreground">Saldo Final</span>
                        <span className="text-xl font-bold text-primary">
                          {formatCurrency(invoice.totalDue)}
                        </span>
                      </div>
                    </div>
                  </div>
                </ScrollArea>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={handlePrint}>
                    <Printer className="mr-1 size-3" />
                    Imprimir
                  </Button>
                  {invoice.status !== "pagada" && invoice.totalDue > 0 && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setPayInvoice(invoice)
                      }}
                    >
                      Registrar Pago
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

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