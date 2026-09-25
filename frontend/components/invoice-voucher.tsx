"use client"

import type { Invoice, Guest, Reservation, Room } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { invoiceStatusConfig } from "@/lib/constants"

interface InvoiceVoucherProps {
  invoice: Invoice
  guest: Guest | null | undefined
  reservation: Reservation | null | undefined
  room: Room | null | undefined
  productName: (productId: string) => string | undefined
}

export function InvoiceVoucher({ invoice, guest, reservation, room, productName }: InvoiceVoucherProps) {
  const status = invoiceStatusConfig[invoice.status]

  return (
    <div className="voucher-print">
      <div className="voucher-accent-bar" />
      <div className="voucher-header">
        <div className="voucher-logo">
          <div className="voucher-logo-icon">H</div>
          <div>
            <h1 className="voucher-hotel-name">HotelManager</h1>
            <p className="voucher-hotel-sub">PMS & POS</p>
          </div>
        </div>
        <div className={`voucher-stamp ${status.stampClass}`}>{status.label}</div>
      </div>

      <div className="voucher-invoice-info">
        <h2 className="voucher-title">FACTURA</h2>
        <p className="voucher-mono">{invoice.id.toUpperCase()}</p>
        <p className="voucher-date">{invoice.date}</p>
      </div>

      <div className="voucher-grid">
        <div className="voucher-section">
          <p className="voucher-label">CLIENTE</p>
          <p className="voucher-value">{guest?.name}</p>
          <p className="voucher-small">{guest?.document}</p>
          <p className="voucher-small">{guest?.email}</p>
          <p className="voucher-small">{guest?.phone}</p>
        </div>
        <div className="voucher-section">
          <p className="voucher-label">HABITACION</p>
          <p className="voucher-value">Hab. {room?.number} — {room?.type}</p>
          <p className="voucher-small">Check-in: {reservation?.checkIn}</p>
          <p className="voucher-small">Check-out: {reservation?.checkOut}</p>
        </div>
      </div>

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
      </div>

      <div className="voucher-final">
        <div>
          <p className="voucher-label">{invoice.totalDue > 0 ? "SALDO PENDIENTE" : "TOTAL PAGADO"}</p>
          <p className="voucher-small">Monto de esta factura</p>
        </div>
        <p className="voucher-final-amount">{formatCurrency(invoice.totalDue)}</p>
      </div>

      <div className="voucher-footer">
        <p>Gracias por su preferencia</p>
        <p className="voucher-small">HotelManager — Sistema de Gestion Hotelera</p>
        <p className="voucher-small">Documento generado el {invoice.date}</p>
      </div>
    </div>
  )
}