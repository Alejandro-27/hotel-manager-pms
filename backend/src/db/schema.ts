import { pgTable, text, integer, real, jsonb } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['admin', 'recepcion', 'catering', 'contabilidad'] }).notNull().default('recepcion'),
  hotelName: text('hotel_name'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const rooms = pgTable('rooms', {
  id: text('id').primaryKey(),
  number: text('number').notNull().unique(),
  floor: integer('floor').notNull(),
  type: text('type', { enum: ['individual', 'doble', 'suite', 'familiar'] }).notNull(),
  maxCapacity: integer('max_capacity').notNull(),
  pricePerNight: real('price_per_night').notNull(),
  status: text('status', { enum: ['libre', 'ocupada', 'mantenimiento', 'limpieza'] }).notNull().default('libre'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const guests = pgTable('guests', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  document: text('document').notNull().unique(),
  country: text('country').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  createdAt: text('created_at').notNull(),
})

export const reservations = pgTable('reservations', {
  id: text('id').primaryKey(),
  guestId: text('guest_id').notNull().references(() => guests.id),
  roomId: text('room_id').notNull().references(() => rooms.id),
  checkIn: text('check_in').notNull(),
  checkOut: text('check_out').notNull(),
  guests: integer('guests').notNull().default(1),
  status: text('status', { enum: ['confirmada', 'checkin', 'checkout', 'cancelada'] }).notNull().default('confirmada'),
  totalAmount: real('total_amount').notNull(),
  advancePayment: real('advance_payment').notNull().default(0),
  paymentMethod: text('payment_method', { enum: ['efectivo', 'tarjeta', 'transferencia'] }).notNull(),
  notes: text('notes').notNull().default(''),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const products = pgTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category', { enum: ['desayunos', 'snacks', 'bebidas'] }).notNull(),
  price: real('price').notNull(),
  currentStock: integer('current_stock').notNull().default(0),
  minStock: integer('min_stock').notNull().default(0),
  image: text('image').notNull().default(''),
  createdAt: text('created_at').notNull(),
})

export const sales = pgTable('sales', {
  id: text('id').primaryKey(),
  items: jsonb('items').$type<{ productId: string; quantity: number; unitPrice: number }[]>().notNull(),
  total: real('total').notNull(),
  paymentMethod: text('payment_method', { enum: ['efectivo', 'tarjeta', 'cargo_habitacion'] }).notNull(),
  roomId: text('room_id').references(() => rooms.id),
  date: text('date').notNull(),
  time: text('time').notNull(),
  createdAt: text('created_at').notNull(),
})

export const invoices = pgTable('invoices', {
  id: text('id').primaryKey(),
  reservationId: text('reservation_id').notNull().references(() => reservations.id),
  guestId: text('guest_id').notNull().references(() => guests.id),
  roomNights: jsonb('room_nights').$type<{ nights: number; pricePerNight: number }>().notNull(),
  cateringCharges: jsonb('catering_charges').$type<{ productId: string; quantity: number; unitPrice: number }[]>().notNull().default([]),
  tax: real('tax').notNull().default(0),
  subtotal: real('subtotal').notNull(),
  advancePayment: real('advance_payment').notNull().default(0),
  totalDue: real('total_due').notNull(),
  status: text('status', { enum: ['pagada', 'parcial', 'pendiente'] }).notNull().default('pendiente'),
  date: text('date').notNull(),
  createdAt: text('created_at').notNull(),
})

export const expenses = pgTable('expenses', {
  id: text('id').primaryKey(),
  category: text('category', { enum: ['mantenimiento', 'limpieza', 'servicios', 'nominas', 'otros'] }).notNull(),
  amount: real('amount').notNull(),
  date: text('date').notNull(),
  note: text('note').notNull().default(''),
  createdAt: text('created_at').notNull(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Room = typeof rooms.$inferSelect
export type NewRoom = typeof rooms.$inferInsert
export type Guest = typeof guests.$inferSelect
export type NewGuest = typeof guests.$inferInsert
export type Reservation = typeof reservations.$inferSelect
export type NewReservation = typeof reservations.$inferInsert
export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
export type Sale = typeof sales.$inferSelect
export type NewSale = typeof sales.$inferInsert
export type Invoice = typeof invoices.$inferSelect
export type NewInvoice = typeof invoices.$inferInsert
export type Expense = typeof expenses.$inferSelect
export type NewExpense = typeof expenses.$inferInsert