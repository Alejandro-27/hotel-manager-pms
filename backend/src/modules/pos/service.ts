import { randomUUID } from 'node:crypto'
import { and, asc, desc, eq, gte, sql } from 'drizzle-orm'
import type { Product as ProductType } from '@hotel/types'
import { db } from '../../db/index.js'
import { products, reservations, rooms, sales, invoices } from '../../db/schema.js'
import { AppError } from '../../plugins/error-handler.js'
import { syncInvoiceForReservation } from '../billing/service.js'
import type { CreateProductInput, CreateSaleInput, UpdateProductInput, UpdateStockInput } from './schemas.js'

export async function listProducts(tenantId: string, category?: ProductType['category']) {
  const conditions = [eq(products.tenantId, tenantId)]
  if (category) conditions.push(eq(products.category, category))
  return db.select().from(products).where(and(...conditions)).orderBy(asc(products.name))
}

export async function createProduct(tenantId: string, input: CreateProductInput) {
  const id = randomUUID()
  await db.insert(products).values({ id, tenantId, ...input, createdAt: new Date().toISOString() })
  return getProductById(tenantId, id)
}

export async function getProductById(tenantId: string, id: string) {
  const product = (await db.select().from(products).where(and(
    eq(products.id, id),
    eq(products.tenantId, tenantId),
  )).limit(1))[0]
  if (!product) throw new AppError(404, 'Producto no encontrado')
  return product
}

export async function updateStock(tenantId: string, id: string, input: UpdateStockInput) {
  await getProductById(tenantId, id)
  await db.update(products).set({ currentStock: input.currentStock }).where(and(
    eq(products.id, id),
    eq(products.tenantId, tenantId),
  ))
  return getProductById(tenantId, id)
}

export async function updateProduct(tenantId: string, id: string, input: UpdateProductInput) {
  await getProductById(tenantId, id)
  await db.update(products).set(input).where(and(
    eq(products.id, id),
    eq(products.tenantId, tenantId),
  ))
  return getProductById(tenantId, id)
}

export async function deleteProduct(tenantId: string, id: string) {
  await getProductById(tenantId, id)

  const ref = JSON.stringify([{ productId: id }])
  const saleHit = (
    await db.select().from(sales).where(and(
      eq(sales.tenantId, tenantId),
      sql`${sales.items} @> ${ref}::jsonb`,
    )).limit(1)
  )[0]
  const invoiceHit = (
    await db.select().from(invoices).where(and(
      eq(invoices.tenantId, tenantId),
      sql`${invoices.cateringCharges} @> ${ref}::jsonb`,
    )).limit(1)
  )[0]

  if (saleHit || invoiceHit) {
    throw new AppError(409, 'El producto tiene historial de ventas; desactivalo en lugar de eliminarlo')
  }

  await db.delete(products).where(and(
    eq(products.id, id),
    eq(products.tenantId, tenantId),
  ))
}

export async function createSale(tenantId: string, input: CreateSaleInput) {
  return db.transaction(async (tx) => {
    if (input.paymentMethod === 'cargo_habitacion') {
      if (!input.roomId) {
        throw new AppError(400, 'Una venta con cargo a habitación requiere roomId')
      }
      const room = (await tx.select().from(rooms).where(and(
        eq(rooms.id, input.roomId),
        eq(rooms.tenantId, tenantId),
      )).limit(1))[0]
      if (!room) throw new AppError(404, 'Habitación no encontrada')
      if (room.status !== 'ocupada') {
        throw new AppError(409, 'La habitación no está ocupada')
      }
    }

    let total = 0
    const normalizedItems: { productId: string; quantity: number; unitPrice: number }[] = []

    for (const item of input.items) {
      const product = (await tx.select().from(products).where(and(
        eq(products.id, item.productId),
        eq(products.tenantId, tenantId),
      )).limit(1))[0]
      if (!product) {
        throw new AppError(404, `Producto ${item.productId} no encontrado`)
      }
      if (!product.active) {
        throw new AppError(409, `El producto ${product.name} esta desactivado y no se puede vender`)
      }

      const updated = await tx.update(products)
        .set({ currentStock: sql`${products.currentStock} - ${item.quantity}` })
        .where(and(eq(products.id, item.productId), gte(products.currentStock, item.quantity)))
        .returning({ currentStock: products.currentStock })

      if (updated.length === 0) {
        throw new AppError(409, `Stock insuficiente de ${product.name}: disponible ${product.currentStock}, pedido ${item.quantity}`)
      }

      total += product.price * item.quantity
      normalizedItems.push({ productId: item.productId, quantity: item.quantity, unitPrice: product.price })
    }

    const now = new Date()
    const id = randomUUID()
    const sale = {
      id,
      tenantId,
      items: normalizedItems,
      total: Math.round(total * 100) / 100,
      paymentMethod: input.paymentMethod,
      roomId: input.paymentMethod === 'cargo_habitacion' ? (input.roomId ?? null) : null,
      date: now.toISOString().slice(0, 10),
      time: now.toTimeString().slice(0, 5),
      createdAt: now.toISOString(),
    }

    await tx.insert(sales).values(sale)

    if (sale.paymentMethod === 'cargo_habitacion' && sale.roomId) {
      const reservation = (await tx.select().from(reservations).where(and(
        eq(reservations.roomId, sale.roomId),
        eq(reservations.tenantId, tenantId),
        eq(reservations.status, 'checkin'),
      )).limit(1))[0]
      if (reservation) {
        await syncInvoiceForReservation(tx, reservation, tenantId)
      }
    }

    return sale
  })
}

export async function listSales(tenantId: string, date?: string) {
  const conditions = [eq(sales.tenantId, tenantId)]
  if (date) conditions.push(eq(sales.date, date))
  return db.select().from(sales).where(and(...conditions)).orderBy(desc(sales.createdAt))
}
