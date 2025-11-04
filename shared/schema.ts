import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const services = pgTable("services", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  duration: text("duration").notNull(),
  price: integer("price").notNull(),
  photo: text("photo"), // URL or file path for service photo
});

export const stylists = pgTable("stylists", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  experience: text("experience").notNull(),
  rating: integer("rating").notNull(),
  specialties: text("specialties").array().notNull(),
});

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingReference: text("booking_reference").notNull().unique(),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  serviceId: varchar("service_id").notNull().references(() => services.id),
  stylistId: varchar("stylist_id").references(() => stylists.id),
  appointmentDate: timestamp("appointment_date").notNull(),
  appointmentTime: text("appointment_time").notNull(),
  status: text("status").notNull().default("backlog"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stylistAvailability = pgTable("stylist_availability", {
  id: serial("id").primaryKey(),
  stylistId: varchar("stylist_id").notNull().references(() => stylists.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Monday, 6 = Sunday
  startTime: text("start_time").notNull(), // Format: "HH:mm" (24-hour)
  endTime: text("end_time").notNull(), // Format: "HH:mm" (24-hour)
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});

export const insertServiceSchema = createInsertSchema(services);

export const insertStylistSchema = createInsertSchema(stylists);

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  bookingReference: true,
  createdAt: true,
  status: true,
});

export const insertStylistAvailabilitySchema = createInsertSchema(stylistAvailability).omit({
  id: true,
});

export const updateBookingStatusSchema = z.object({
  id: z.string(),
  status: z.enum(["backlog", "for_today", "in_progress", "done", "cancelled"]),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Stylist = typeof stylists.$inferSelect;
export type InsertStylist = z.infer<typeof insertStylistSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type StylistAvailability = typeof stylistAvailability.$inferSelect;
export type InsertStylistAvailability = z.infer<typeof insertStylistAvailabilitySchema>;
export type UpdateBookingStatus = z.infer<typeof updateBookingStatusSchema>;

export interface BookingWithDetails extends Booking {
  client: Client;
  service: Service;
  stylist: Stylist | null;
}
