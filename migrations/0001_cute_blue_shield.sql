CREATE TABLE "salon_inquiries" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "name" text NOT NULL,
        "email" text NOT NULL,
        "phone" text NOT NULL,
        "salon_name" text NOT NULL,
        "message" text,
        "status" text DEFAULT 'pending' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "services" ALTER COLUMN "duration" SET DATA TYPE integer USING duration::integer;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "final_price" integer;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "birth_date" timestamp;--> statement-breakpoint
ALTER TABLE "salons" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "salons" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "salons" ADD COLUMN "location" text;--> statement-breakpoint
ALTER TABLE "salons" ADD COLUMN "whatsapp_number" text;--> statement-breakpoint
ALTER TABLE "salons" ADD COLUMN "instagram_url" text;--> statement-breakpoint
ALTER TABLE "salons" ADD COLUMN "facebook_url" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "currency" text DEFAULT 'colones' NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "reservation_amount" integer;