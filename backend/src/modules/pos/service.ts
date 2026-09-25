import { randomUUID } from 'node:crypto'
import { and, asc, desc, eq, sql } from 'drizzle-orm'
import type { Product as ProductType } from '@hotel/types'
import { db } from '../../db/index.js'
import { products, reservations, rooms, sales, invoices } from '../../db/schema.js'
import { AppError } from '../../plugins/error-handler.js'
import { syncInvoiceForReservation } from '../billing/service.js'
import type { CreateProductInput, CreateSaleInput, UpdateProductInput, UpdateStockInput } from './schemas.js'

export async function listProducts(category?: ProductType['category']) {
  if (category) {
    return db.select().from(products).where(eq(products.category, category)).orderBy(asc(products.name))
  }
  return db.select().from(products).orderBy(asc(products.name))
}

export async function createProduct(input: CreateProductInput) {
  const id = randomUUID()
  await db.insert(products).values({ id, ...input, createdAt: new Date().toISOString() })
  return getProductById(id)
}

export async function getProductById(id: string) {
  const product = (await db.select().from(products).where(eq(products.id, id)).limit(1))[0]
  if (!product) throw new AppError(404, 'Producto no encontrado')
  return product
}

export async function updateStock(id: string, input: UpdateStockInput) {
  await getProductById(id)
  await db.update(products).set({ currentStock: input.currentStock }).where(eq(products.id, id))
  return getProductById(id)
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  await getProductById(id)
  await db.update(products).set(input).where(eq(products.id, id))
  return getProductById(id)
}

export async function deleteProduct(id: string) {
  await getProductById(id)

  const ref = JSON.stringify([{ productId: id }])
  const saleHit = (
    await db.select().from(sales).where(sql`${sales.items} @> ${ref}::jsonb`).limit(1)
  )[0]
  const invoiceHit = (
    await db.select().from(invoices).where(sql`${invoices.cateringCharges} @> ${ref}::jsonb`).limit(1)
  )[0]

  if (saleHit || invoiceHit) {
    throw new AppError(409, 'El producto tiene historial de ventas; desactivalo en lugar de eliminarlo')
  }

  await db.delete(products).where(eq(products.id, id))
}

export async function createSale(input: CreateSaleInput) {
  return db.transaction(async (tx) => {
    if (input.paymentMethod === 'cargo_habitacion') {
      if (!input.roomId) {
        throw new AppError(400, 'Una venta con cargo a habitación requiere roomId')
      }
      const room = (await tx.select().from(rooms).where(eq(rooms.id, input.roomId)).limit(1))[0]
      if (!room) throw new AppError(404, 'Habitación no encontrada')
      if (room.status !== 'ocupada') {
        throw new AppError(409, 'La habitación no está ocupada')
      }
    }

    let total = 0
    for (const item of input.items) {
      const product = (await tx.select().from(products).where(eq(products.id, item.productId)).limit(1))[0]
      if (!product) {
        throw new AppError(404, `Producto ${item.productId} no encontrado`)
      }
      if (!product.active) {
        throw new AppError(409, `El producto ${product.name} esta desactivado y no se puede vender`)
      }
      if (item.quantity > product.currentStock) {
        throw new AppError(409, `Stock insuficiente de ${product.name}: disponible ${product.currentStock}, pedido ${item.quantity}`)
      }
      total += item.unitPrice * item.quantity

      await tx.update(products)
        .set({ currentStock: product.currentStock - item.quantity })
        .where(eq(products.id, item.productId))
    }

    const now = new Date()
    const id = randomUUID()
    const sale = {
      id,
      items: input.items,
      total: Math.round(total * 100) / 100,
      paymentMethod: input.paymentMethod,
      roomId: input.roomId ?? null,
      date: now.toISOString().slice(0, 10),
      time: now.toTimeString().slice(0, 5),
      createdAt: now.toISOString(),
    }

    await tx.insert(sales).values(sale)

    if (sale.paymentMethod === 'cargo_habitacion' && sale.roomId) {
      const reservation = (await tx.select().from(reservations).where(and(
        eq(reservations.roomId, sale.roomId),
        eq(reservations.status, 'checkin'),
      )).limit(1))[0]
      if (reservation) {
        await syncInvoiceForReservation(tx, reservation)
      }
    }

    return sale
  })
}

export async function listSales(date?: string) {
  if (date) {
    return db.select().from(sales).where(eq(sales.date, date)).orderBy(desc(sales.createdAt))
  }
  return db.select().from(sales).orderBy(desc(sales.createdAt))
}
