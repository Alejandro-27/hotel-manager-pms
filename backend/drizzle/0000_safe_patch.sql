CREATE TABLE "guests" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"document" text NOT NULL,
	"country" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"created_at" text NOT NULL,
	CONSTRAINT "guests_document_unique" UNIQUE("document")
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"reservation_id" text NOT NULL,
	"guest_id" text NOT NULL,
	"room_nights" jsonb NOT NULL,
	"catering_charges" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tax" real DEFAULT 0 NOT NULL,
	"subtotal" real NOT NULL,
	"advance_payment" real DEFAULT 0 NOT NULL,
	"total_due" real NOT NULL,
	"status" text DEFAULT 'pendiente' NOT NULL,
	"date" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"price" real NOT NULL,
	"current_stock" integer DEFAULT 0 NOT NULL,
	"min_stock" integer DEFAULT 0 NOT NULL,
	"image" text DEFAULT '' NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" text PRIMARY KEY NOT NULL,
	"guest_id" text NOT NULL,
	"room_id" text NOT NULL,
	"check_in" text NOT NULL,
	"check_out" text NOT NULL,
	"guests" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'confirmada' NOT NULL,
	"total_amount" real NOT NULL,
	"advance_payment" real DEFAULT 0 NOT NULL,
	"payment_method" text NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" text PRIMARY KEY NOT NULL,
	"number" text NOT NULL,
	"floor" integer NOT NULL,
	"type" text NOT NULL,
	"max_capacity" integer NOT NULL,
	"price_per_night" real NOT NULL,
	"status" text DEFAULT 'libre' NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "rooms_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" text PRIMARY KEY NOT NULL,
	"items" jsonb NOT NULL,
	"total" real NOT NULL,
	"payment_method" text NOT NULL,
	"room_id" text,
	"date" text NOT NULL,
	"time" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'recepcion' NOT NULL,
	"hotel_name" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;