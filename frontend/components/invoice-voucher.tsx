"use client"

import { forwardRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { Invoice, Guest, Reservation, Room } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

interface InvoiceVoucherProps {
  invoice: Invoice
  guest: Guest | null | undefined
  reservation: Reservation | null | undefined
  room: Room | null | undefined
  productName: (productId: string) => string | undefined
}

const statusLabel: Record<string, string> = {
  pagada: "PAGADA",
  parcial: "PAGO PARCIAL",
  pendiente: "PENDIENTE",
}

export const InvoiceVoucher = forwardRef<HTMLDivElement, InvoiceVoucherProps>(
  ({ invoice, guest, reservation, room, productName }, ref) => {
    return (
      <div ref={ref} className="voucher-print">
        <div className="voucher-header">
          <div className="voucher-logo">
            <div className="voucher-logo-icon">H</div>
            <div>
              <h1 className="voucher-hotel-name">HotelManager</h1>
              <p className="voucher-hotel-sub">PMS & POS</p>
            </div>
          </div>
          <div className="voucher-invoice-info">
            <h2 className="voucher-title">FACTURA</h2>
            <p className="voucher-mono">{invoice.id.toUpperCase()}</p>
            <p>{invoice.date}</p>
            <Badge className={`mt-1 text-xs ${invoice.status === "pagada" ? "bg-emerald-100 text-emerald-800" : invoice.status === "parcial" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"} border-0`}>
              {statusLabel[invoice.status]}
            </Badge>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="voucher-section">
          <p className="voucher-label">CLIENTE</p>
          <p className="voucher-value">{guest?.name}</p>
          <p className="voucher-small">{guest?.document}</p>
          <p className="voucher-small">{guest?.email}</p>
          <p className="voucher-small">{guest?.phone}</p>
        </div>

        <div className="voucher-section">
          <p className="voucher-label">HABITACION</p>
          <p className="voucher-value">
            Hab. {room?.number} — {room?.type}
          </p>
          <p className="voucher-small">
            Check-in: {reservation?.checkIn} | Check-out: {reservation?.checkOut}
          </p>
        </div>

        <Separator className="my-4" />

        <div className="voucher-table">
          <div className="voucher-table-header">
            <span>Concepto</span>
            <span>Cant.</span>
            <span>Precio</span>
            <span>Total</span>
          </div>
          <div className="voucher-table-row">
            <span>Alojamiento Hab. {room?.number}</span>
            <span>{invoice.roomNights.nights} noches</span>
            <span>{formatCurrency(invoice.roomNights.pricePerNight)}</span>
            <span>{formatCurrency(invoice.roomNights.nights * invoice.roomNights.pricePerNight)}</span>
          </div>
          {invoice.cateringCharges.map((item, i) => (
            <div key={i} className="voucher-table-row">
              <span>{productName(item.productId) ?? "Producto"}</span>
              <span>{item.quantity}</span>
              <span>{formatCurrency(item.unitPrice)}</span>
              <span>{formatCurrency(item.quantity * item.unitPrice)}</span>
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="voucher-totals">
          <div className="voucher-total-row">
            <span>Subtotal</span>
            <span>{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="voucher-total-row">
            <span>IVA ({invoice.tax}%)</span>
            <span>{formatCurrency(invoice.subtotal * (invoice.tax / 100))}</span>
          </div>
          <div className="voucher-total-row voucher-green">
            <span>Anticipo pagado</span>
            <span>-{formatCurrency(invoice.advancePayment)}</span>
          </div>
          <Separator className="my-2" />
          <div className="voucher-total-row voucher-bold">
            <span>SALDO FINAL</span>
            <span>{formatCurrency(invoice.totalDue)}</span>
          </div>
        </div>

        <div className="voucher-footer">
          <p>Gracias por su preferencia</p>
          <p className="voucher-small">HotelManager — Sistema de Gestion Hotelera</p>
          <p className="voucher-small">Documento generado el {invoice.date}</p>
        </div>
      </div>
    )
  }
)

InvoiceVoucher.displayName = "InvoiceVoucher"