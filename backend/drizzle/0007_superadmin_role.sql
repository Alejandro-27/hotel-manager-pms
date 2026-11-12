-- 0007_superadmin_role.sql
-- Agregar rol de superadmin (dueño del sistema)

ALTER TYPE "users_role_enum" ADD VALUE 'superadmin';--> statement-breakpoint
