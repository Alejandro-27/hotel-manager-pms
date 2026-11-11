import { randomUUID } from 'node:crypto'
import { and, desc, eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { expenses } from '../../db/schema.js'
import { AppError } from '../../plugins/error-handler.js'
import type { CreateExpenseInput } from './schemas.js'

export async function listExpenses(tenantId: string) {
  return db.select().from(expenses).where(eq(expenses.tenantId, tenantId)).orderBy(desc(expenses.date), desc(expenses.createdAt))
}

export async function createExpense(tenantId: string, input: CreateExpenseInput) {
  const id = randomUUID()
  await db.insert(expenses).values({ id, tenantId, ...input, createdAt: new Date().toISOString() })
  return getExpenseById(tenantId, id)
}

export async function getExpenseById(tenantId: string, id: string) {
  const expense = (await db.select().from(expenses).where(and(
    eq(expenses.id, id),
    eq(expenses.tenantId, tenantId),
  )).limit(1))[0]
  if (!expense) throw new AppError(404, 'Gasto no encontrado')
  return expense
}

export async function deleteExpense(tenantId: string, id: string) {
  await getExpenseById(tenantId, id)
  await db.delete(expenses).where(and(
    eq(expenses.id, id),
    eq(expenses.tenantId, tenantId),
  ))
  return { id }
}

