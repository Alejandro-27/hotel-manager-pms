import { and, desc, eq } from 'drizzle-orm'
import type { InvoiceStatus } from '@hotel/types'
import { db } from '../../db/index.js'
import { invoices } from '../../db/schema.js'
import { AppError } from '../../plugins/error-handler.js'
import type { PayInvoiceInput } from './schemas.js'

export interface InvoiceFilters {
  status?: InvoiceStatus
  guestId?: string
}

export async function listInvoices(filters: InvoiceFilters = {}) {
  const conditions = []
  if (filters.status) conditions.push(eq(invoices.status, filters.status))
  if (filters.guestId) conditions.push(eq(invoices.guestId, filters.guestId))

  const query = db.select().from(invoices)
  const filtered = conditions.length > 0 ? query.where(and(...conditions)) : query
  return filtered.orderBy(desc(invoices.createdAt))
}

export async function getInvoiceById(id: string) {
  const invoice = (await db.select().from(invoices).where(eq(invoices.id, id)).limit(1))[0]
  if (!invoice) throw new AppError(404, 'Factura no encontrada')
  return invoice
}

export async function payInvoice(id: string, input: PayInvoiceInput) {
  const invoice = await getInvoiceById(id)
  if (invoice.status === 'pagada') {
    throw new AppError(409, 'La factura ya está pagada')
  }

  const newPaid = Math.round((invoice.advancePayment + input.amount) * 100) / 100
  const newTotalDue = Math.round((invoice.totalDue - input.amount) * 100) / 100
  const status = newTotalDue <= 0 ? 'pagada' : 'parcial'

  await db.update(invoices)
    .set({ advancePayment: newPaid, totalDue: Math.max(newTotalDue, 0), status })
    .where(eq(invoices.id, id))

  return getInvoiceById(id)
}
