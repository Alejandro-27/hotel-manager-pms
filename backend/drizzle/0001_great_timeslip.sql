CREATE TABLE "expenses" (
	"id" text PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"amount" real NOT NULL,
	"date" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" text NOT NULL
);
