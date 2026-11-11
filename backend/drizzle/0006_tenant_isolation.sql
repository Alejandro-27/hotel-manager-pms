-- 0006_tenant_isolation.sql
-- Aislamiento multitenant por hotel. Cada tenant es un hotel independiente.

-- 1. Tabla de tenants (hoteles)
CREATE TABLE "tenants" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "created_at" text NOT NULL,
  "updated_at" text NOT NULL
);--> statement-breakpoint

-- 2. Crear tenant por defecto para datos existentes
INSERT INTO "tenants" ("id", "name", "slug", "created_at", "updated_at")
VALUES ('tenant_default', 'Hotel Principal', 'hotel-principal', '2026-01-01', '2026-01-01')
ON CONFLICT ("slug") DO NOTHING;--> statement-breakpoint

-- 3. users: agregar tenant_id, status, cambiar role enum, quitar hotelName
ALTER TABLE "users" ADD COLUMN "tenant_id" text REFERENCES "tenants"("id");--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" text NOT NULL DEFAULT 'pendiente' CHECK ("status" IN ('pendiente', 'activo', 'rechazado', 'suspendido'));--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "invited_by" text REFERENCES "users"("id");--> statement-breakpoint
ALTER TYPE "users_role_enum" ADD VALUE 'pendiente';--> statement-breakpoint

-- Asignar tenant por defecto y activar usuarios existentes
UPDATE "users" SET "tenant_id" = 'tenant_default', "status" = 'activo' WHERE "tenant_id" IS NULL;--> statement-breakpoint

ALTER TABLE "users" ALTER COLUMN "tenant_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "hotel_name";--> statement-breakpoint

-- 4. rooms: agregar tenant_id, unique (tenant_id, number)
ALTER TABLE "rooms" ADD COLUMN "tenant_id" text NOT NULL REFERENCES "tenants"("id");--> statement-breakpoint
UPDATE "rooms" SET "tenant_id" = 'tenant_default' WHERE "tenant_id" IS NULL;--> statement-breakpoint
ALTER TABLE "rooms" DROP CONSTRAINT "rooms_number_unique";--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_tenant_number_unique" UNIQUE ("tenant_id", "number");--> statement-breakpoint

-- 5. guests: agregar tenant_id, unique (tenant_id, document)
ALTER TABLE "guests" ADD COLUMN "tenant_id" text NOT NULL REFERENCES "tenants"("id");--> statement-breakpoint
UPDATE "guests" SET "tenant_id" = 'tenant_default' WHERE "tenant_id" IS NULL;--> statement-breakpoint
ALTER TABLE "guests" DROP CONSTRAINT "guests_document_unique";--> statement-breakpoint
ALTER TABLE "guests" ADD CONSTRAINT "guests_tenant_document_unique" UNIQUE ("tenant_id", "document");--> statement-breakpoint

-- 6. reservations: agregar tenant_id
ALTER TABLE "reservations" ADD COLUMN "tenant_id" text NOT NULL REFERENCES "tenants"("id");--> statement-breakpoint
UPDATE "reservations" SET "tenant_id" = 'tenant_default' WHERE "tenant_id" IS NULL;--> statement-breakpoint

-- 7. products: agregar tenant_id
ALTER TABLE "products" ADD COLUMN "tenant_id" text NOT NULL REFERENCES "tenants"("id");--> statement-breakpoint
UPDATE "products" SET "tenant_id" = 'tenant_default' WHERE "tenant_id" IS NULL;--> statement-breakpoint

-- 8. sales: agregar tenant_id
ALTER TABLE "sales" ADD COLUMN "tenant_id" text NOT NULL REFERENCES "tenants"("id");--> statement-breakpoint
UPDATE "sales" SET "tenant_id" = 'tenant_default' WHERE "tenant_id" IS NULL;--> statement-breakpoint

-- 9. invoices: agregar tenant_id
ALTER TABLE "invoices" ADD COLUMN "tenant_id" text NOT NULL REFERENCES "tenants"("id");--> statement-breakpoint
UPDATE "invoices" SET "tenant_id" = 'tenant_default' WHERE "tenant_id" IS NULL;--> statement-breakpoint

-- 10. expenses: agregar tenant_id
ALTER TABLE "expenses" ADD COLUMN "tenant_id" text NOT NULL REFERENCES "tenants"("id");--> statement-breakpoint
UPDATE "expenses" SET "tenant_id" = 'tenant_default' WHERE "tenant_id" IS NULL;--> statement-breakpoint

-- 11. settings: cambiar pk a tenant_id
ALTER TABLE "settings" DROP CONSTRAINT "settings_pkey";--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "tenant_id" text REFERENCES "tenants"("id");--> statement-breakpoint
UPDATE "settings" SET "tenant_id" = 'tenant_default' WHERE "tenant_id" IS NULL;--> statement-breakpoint
ALTER TABLE "settings" ALTER COLUMN "tenant_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_pkey" PRIMARY KEY ("tenant_id");--> statement-breakpoint
ALTER TABLE "settings" DROP COLUMN "id";--> statement-breakpoint

-- 12. refresh_sessions: agregar tenant_id
ALTER TABLE "refresh_sessions" ADD COLUMN "tenant_id" text NOT NULL REFERENCES "tenants"("id");--> statement-breakpoint
UPDATE "refresh_sessions" SET "tenant_id" = 'tenant_default' WHERE "tenant_id" IS NULL;--> statement-breakpoint

-- Índices para optimizar consultas por tenant
CREATE INDEX idx_users_tenant_role ON "users" ("tenant_id", "role");--> statement-breakpoint
CREATE INDEX idx_users_email ON "users" ("email");--> statement-breakpoint
CREATE INDEX idx_rooms_tenant_status ON "rooms" ("tenant_id", "status");--> statement-breakpoint
CREATE INDEX idx_guests_tenant_document ON "guests" ("tenant_id", "document");--> statement-breakpoint
CREATE INDEX idx_reservations_tenant_dates ON "reservations" ("tenant_id", "check_in", "check_out");--> statement-breakpoint
CREATE INDEX idx_products_tenant_category ON "products" ("tenant_id", "category");--> statement-breakpoint
CREATE INDEX idx_sales_tenant_date ON "sales" ("tenant_id", "date");--> statement-breakpoint
CREATE INDEX idx_invoices_tenant_status ON "invoices" ("tenant_id", "status");--> statement-breakpoint
CREATE INDEX idx_expenses_tenant_date ON "expenses" ("tenant_id", "date");--> statement-breakpoint
