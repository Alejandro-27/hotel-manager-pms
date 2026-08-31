"use client"

import { useState, useMemo, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
} from "@/components/ui/dialog"
import {
  Receipt,
  Eye,
  Printer,
  FileText,
  CircleDollarSign,
  User,
  BedDouble,
  CalendarDays,
} from "lucide-react"
import {
  invoices,
  getGuestById,
  getRoomById,
  getProductById,
  reservations,
  type InvoiceStatus,
} from "@/lib/store"
import { formatCurrency } from "@/lib/utils"
import { InvoiceVoucher } from "@/components/invoice-voucher"

const statusStyles: Record<InvoiceStatus, { label: string; className: string }> = {
  pagada: { label: "Pagada", className: "bg-emerald-100 text-emerald-800" },
  parcial: { label: "Parcial", className: "bg-amber-100 text-amber-800" },
  pendiente: { label: "Pendiente", className: "bg-red-100 text-red-800" },
}

export function BillingView() {
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null)
  const voucherRef = useRef<HTMLDivElement>(null)

  function handlePrint() {
    window.print()
  }

  const invoice = selectedInvoice
    ? invoices.find((i) => i.id === selectedInvoice)
    : null
  const invoiceGuest = invoice ? getGuestById(invoice.guestId) : null
  const invoiceReservation = invoice
    ? reservations.find((r) => r.id === invoice.reservationId)
    : null
  const invoiceRoom = invoiceReservation
    ? getRoomById(invoiceReservation.roomId)
    : null

  const totalPaid = useMemo(() =>
    invoices.filter(i => i.status === "pagada").reduce((sum, i) => sum + i.subtotal, 0), [])
  const totalPartial = useMemo(() =>
    invoices.filter(i => i.status === "parcial").reduce((sum, i) => sum + i.totalDue, 0), [])
  const totalPending = useMemo(() =>
    invoices.filter(i => i.status === "pendiente").reduce((sum, i) => sum + i.totalDue, 0), [])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Facturacion y Pagos</h1>
        <p className="text-muted-foreground text-sm">Contabilidad y gestion de facturas</p>
      </div>

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

      {/* Invoices Table */}
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
                  const guest = getGuestById(inv.guestId)
                  const reservation = reservations.find((r) => r.id === inv.reservationId)
                  const room = reservation ? getRoomById(reservation.roomId) : null
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
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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
                <InvoiceVoucher ref={voucherRef} invoice={invoice} />
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
                          {invoice.cateringCharges.map((item, i) => {
                            const product = getProductById(item.productId)
                            return (
                              <TableRow key={i}>
                                <TableCell className="text-foreground">
                                  {product?.name ?? "Producto"}
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
                            )
                          })}
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
                  <Button size="sm">
                    Registrar Pago
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
