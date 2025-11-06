import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, serial, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Salons table - each salon has its own isolated data
export const salons = pgTable("salons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: varchar("slug").notNull().unique(), // URL-friendly identifier (e.g., "velvet-salon")
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Junction table for user-salon relationships with roles
export const salonUsers = pgTable("salon_users", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("employee"), // owner, admin, employee
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  birthDate: timestamp("birth_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const services = pgTable("services", {
  id: varchar("id").primaryKey(),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  duration: text("duration").notNull(),
  price: integer("price").notNull(),
  currency: text("currency").notNull().default("colones"), // "dolares" or "colones"
  photo: text("photo"), // URL or file path for service photo
  imageUrl: text("image_url"), // URL for uploaded service image from object storage
});

export const stylists = pgTable("stylists", {
  id: varchar("id").primaryKey(),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }), // Link to user account for system access
  name: text("name").notNull(),
  experience: text("experience").notNull(),
  rating: integer("rating").notNull(),
  specialties: text("specialties").array().notNull(),
  imageUrl: text("image_url"), // URL for uploaded stylist image from object storage
});

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingReference: text("booking_reference").notNull().unique(),
  salonId: varchar("salon_id").notNull().references(() => salons.id, { onDelete: "cascade" }),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  serviceId: varchar("service_id").notNull().references(() => services.id),
  stylistId: varchar("stylist_id").references(() => stylists.id),
  appointmentDate: timestamp("appointment_date").notNull(),
  appointmentTime: text("appointment_time").notNull(),
  status: text("status").notNull().default("backlog"),
  finalPrice: integer("final_price"), // Final price set by employee upon completion
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const salonInquiries = pgTable("salon_inquiries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  salonName: text("salon_name").notNull(),
  message: text("message"),
  status: text("status").notNull().default("pending"), // pending, contacted, converted, rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stylistAvailability = pgTable("stylist_availability", {
  id: serial("id").primaryKey(),
  stylistId: varchar("stylist_id").notNull().references(() => stylists.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Monday, 6 = Sunday
  startTime: text("start_time").notNull(), // Format: "HH:mm" (24-hour)
  endTime: text("end_time").notNull(), // Format: "HH:mm" (24-hour)
});

// Insert schemas
export const upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertSalonSchema = createInsertSchema(salons).omit({
  id: true,
  createdAt: true,
});

export const insertSalonUserSchema = createInsertSchema(salonUsers).omit({
  id: true,
  createdAt: true,
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
  salonId: true,
});

export const insertStylistAvailabilitySchema = createInsertSchema(stylistAvailability).omit({
  id: true,
});

export const insertSalonInquirySchema = createInsertSchema(salonInquiries).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const updateBookingStatusSchema = z.object({
  id: z.string(),
  status: z.enum(["backlog", "for_today", "in_progress", "done", "cancelled"]),
});

export const updateBookingCompletionSchema = z.object({
  status: z.enum(["in_progress", "done", "cancelled"]),
  finalPrice: z.number().int().positive().optional(),
});

// Types
export type User = typeof users.$inferSelect;
export type UpsertUser = z.infer<typeof upsertUserSchema>;

export type Salon = typeof salons.$inferSelect;
export type InsertSalon = z.infer<typeof insertSalonSchema>;

export type SalonUser = typeof salonUsers.$inferSelect;
export type InsertSalonUser = z.infer<typeof insertSalonUserSchema>;

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

export type SalonInquiry = typeof salonInquiries.$inferSelect;
export type InsertSalonInquiry = z.infer<typeof insertSalonInquirySchema>;

export type UpdateBookingStatus = z.infer<typeof updateBookingStatusSchema>;
export type UpdateBookingCompletion = z.infer<typeof updateBookingCompletionSchema>;

export interface BookingWithDetails extends Booking {
  client: Client;
  service: Service;
  stylist: Stylist | null;
}

export interface UserWithSalon extends User {
  salon: Salon;
  role: string;
}
