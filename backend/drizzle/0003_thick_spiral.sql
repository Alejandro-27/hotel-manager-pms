CREATE TABLE "settings" (
	"id" text PRIMARY KEY DEFAULT 'main' NOT NULL,
	"legal_name" text DEFAULT '' NOT NULL,
	"tax_id" text DEFAULT '' NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"jurisdiction" text DEFAULT '' NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
INSERT INTO "settings" ("id", "updated_at") VALUES ('main', '') ON CONFLICT ("id") DO NOTHING;
