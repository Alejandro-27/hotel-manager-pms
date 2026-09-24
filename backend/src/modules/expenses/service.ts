import { randomUUID } from 'node:crypto'
import { desc, eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { expenses } from '../../db/schema.js'
import { AppError } from '../../plugins/error-handler.js'
import type { CreateExpenseInput } from './schemas.js'

export async function listExpenses() {
  return db.select().from(expenses).orderBy(desc(expenses.date), desc(expenses.createdAt))
}

export async function createExpense(input: CreateExpenseInput) {
  const id = randomUUID()
  await db.insert(expenses).values({ id, ...input, createdAt: new Date().toISOString() })
  return getExpenseById(id)
}

export async function getExpenseById(id: string) {
  const expense = (await db.select().from(expenses).where(eq(expenses.id, id)).limit(1))[0]
  if (!expense) throw new AppError(404, 'Gasto no encontrado')
  return expense
}

export async function deleteExpense(id: string) {
  const expense = await getExpenseById(id)
  await db.delete(expenses).where(eq(expenses.id, id))
  return expense
}