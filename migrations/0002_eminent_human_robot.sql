ALTER TABLE "bookings" ADD COLUMN "confirmation_token" varchar;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "token_expiry" timestamp;