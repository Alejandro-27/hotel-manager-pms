ALTER TABLE "reservations" ADD COLUMN "cancellation_policy_accepted_at" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "terms_accepted_at" text;