import { 
  type Client, 
  type InsertClient, 
  type Booking, 
  type InsertBooking,
  type BookingWithDetails,
  type Service,
  type InsertService,
  type Stylist,
  type InsertStylist,
  type StylistAvailability,
  type InsertStylistAvailability,
  type UpdateBookingStatus,
  type User,
  type UpsertUser,
  type Salon,
  type InsertSalon,
  type SalonUser,
  type InsertSalonUser,
  type UserWithSalon,
  clients,
  bookings,
  services,
  stylists,
  stylistAvailability,
  users,
  salons,
  salonUsers,
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Users (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserWithSalon(userId: string): Promise<UserWithSalon | undefined>;
  
  // Salons
  getSalonById(id: string): Promise<Salon | undefined>;
  getSalonBySlug(slug: string): Promise<Salon | undefined>;
  createSalon(salon: InsertSalon): Promise<Salon>;
  
  // Salon Users
  createSalonUser(salonUser: InsertSalonUser): Promise<SalonUser>;
  getUserSalons(userId: string): Promise<SalonUser[]>;
  
  // Clients
  createClient(client: InsertClient): Promise<Client>;
  getClientById(id: string): Promise<Client | undefined>;
  
  // Services (now salon-scoped)
  getServicesBySalon(salonId: string): Promise<Service[]>;
  getServiceById(id: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, salonId: string, service: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: string, salonId: string): Promise<boolean>;
  
  // Stylists (now salon-scoped)
  getStylistsBySalon(salonId: string): Promise<Stylist[]>;
  getStylistById(id: string): Promise<Stylist | undefined>;
  createStylist(stylist: InsertStylist): Promise<Stylist>;
  updateStylist(id: string, salonId: string, stylist: Partial<InsertStylist>): Promise<Stylist | undefined>;
  deleteStylist(id: string, salonId: string): Promise<boolean>;
  
  // Bookings (now salon-scoped)
  createBooking(booking: InsertBooking, salonId: string): Promise<Booking>;
  getBookingById(id: string): Promise<BookingWithDetails | undefined>;
  getBookingsBySalon(salonId: string): Promise<BookingWithDetails[]>;
  updateBookingStatus(data: UpdateBookingStatus, salonId: string): Promise<Booking | undefined>;
  
  // Stylist Availability
  getStylistAvailability(stylistId: string): Promise<StylistAvailability[]>;
  createStylistAvailability(availability: InsertStylistAvailability): Promise<StylistAvailability>;
  updateStylistAvailability(id: number, availability: Partial<InsertStylistAvailability>): Promise<StylistAvailability | undefined>;
  deleteStylistAvailability(id: number): Promise<boolean>;
  setStylistAvailability(stylistId: string, salonId: string, availability: InsertStylistAvailability[]): Promise<StylistAvailability[]>;
}

export class DbStorage implements IStorage {
  // Users (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserWithSalon(userId: string): Promise<UserWithSalon | undefined> {
    const result = await db
      .select({
        user: users,
        salon: salons,
        role: salonUsers.role,
      })
      .from(users)
      .leftJoin(salonUsers, eq(users.id, salonUsers.userId))
      .leftJoin(salons, eq(salonUsers.salonId, salons.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (!result || result.length === 0 || !result[0].salon) {
      return undefined;
    }

    return {
      ...result[0].user,
      salon: result[0].salon,
      role: result[0].role || "employee",
    };
  }

  // Salons
  async getSalonById(id: string): Promise<Salon | undefined> {
    const [salon] = await db.select().from(salons).where(eq(salons.id, id));
    return salon;
  }

  async getSalonBySlug(slug: string): Promise<Salon | undefined> {
    const [salon] = await db.select().from(salons).where(eq(salons.slug, slug));
    return salon;
  }

  async createSalon(insertSalon: InsertSalon): Promise<Salon> {
    const [salon] = await db.insert(salons).values(insertSalon).returning();
    return salon;
  }

  // Salon Users
  async createSalonUser(insertSalonUser: InsertSalonUser): Promise<SalonUser> {
    const [salonUser] = await db.insert(salonUsers).values(insertSalonUser).returning();
    return salonUser;
  }

  async getUserSalons(userId: string): Promise<SalonUser[]> {
    return await db.select().from(salonUsers).where(eq(salonUsers.userId, userId));
  }

  // Clients
  async createClient(insertClient: InsertClient): Promise<Client> {
    const [client] = await db.insert(clients).values(insertClient).returning();
    return client;
  }

  async getClientById(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  // Services (now salon-scoped)
  async getServicesBySalon(salonId: string): Promise<Service[]> {
    return await db.select().from(services).where(eq(services.salonId, salonId));
  }

  async getServiceById(id: string): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }

  async createService(insertService: InsertService): Promise<Service> {
    const [service] = await db.insert(services).values(insertService).returning();
    return service;
  }

  async updateService(id: string, salonId: string, updateData: Partial<InsertService>): Promise<Service | undefined> {
    const [service] = await db.update(services)
      .set(updateData)
      .where(and(eq(services.id, id), eq(services.salonId, salonId)))
      .returning();
    return service;
  }

  async deleteService(id: string, salonId: string): Promise<boolean> {
    const result = await db.delete(services)
      .where(and(eq(services.id, id), eq(services.salonId, salonId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Stylists (now salon-scoped)
  async getStylistsBySalon(salonId: string): Promise<Stylist[]> {
    return await db.select().from(stylists).where(eq(stylists.salonId, salonId));
  }

  async getStylistById(id: string): Promise<Stylist | undefined> {
    const [stylist] = await db.select().from(stylists).where(eq(stylists.id, id));
    return stylist;
  }

  async createStylist(insertStylist: InsertStylist): Promise<Stylist> {
    const [stylist] = await db.insert(stylists).values(insertStylist).returning();
    return stylist;
  }

  async updateStylist(id: string, salonId: string, updateData: Partial<InsertStylist>): Promise<Stylist | undefined> {
    const [stylist] = await db.update(stylists)
      .set(updateData)
      .where(and(eq(stylists.id, id), eq(stylists.salonId, salonId)))
      .returning();
    return stylist;
  }

  async deleteStylist(id: string, salonId: string): Promise<boolean> {
    const result = await db.delete(stylists)
      .where(and(eq(stylists.id, id), eq(stylists.salonId, salonId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Bookings (now salon-scoped)
  async createBooking(insertBooking: InsertBooking, salonId: string): Promise<Booking> {
    const bookingReference = `BK-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000).toString().padStart(6, '0')}`;
    
    const [booking] = await db.insert(bookings).values({
      ...insertBooking,
      salonId,
      bookingReference,
    }).returning();
    
    return booking;
  }

  async getBookingById(id: string): Promise<BookingWithDetails | undefined> {
    const result = await db
      .select({
        booking: bookings,
        client: clients,
        service: services,
        stylist: stylists,
      })
      .from(bookings)
      .leftJoin(clients, eq(bookings.clientId, clients.id))
      .leftJoin(services, eq(bookings.serviceId, services.id))
      .leftJoin(stylists, eq(bookings.stylistId, stylists.id))
      .where(eq(bookings.id, id));

    if (result.length === 0 || !result[0].client || !result[0].service) {
      return undefined;
    }

    return {
      ...result[0].booking,
      client: result[0].client,
      service: result[0].service,
      stylist: result[0].stylist,
    };
  }

  async getBookingsBySalon(salonId: string): Promise<BookingWithDetails[]> {
    const result = await db
      .select({
        booking: bookings,
        client: clients,
        service: services,
        stylist: stylists,
      })
      .from(bookings)
      .leftJoin(clients, eq(bookings.clientId, clients.id))
      .leftJoin(services, eq(bookings.serviceId, services.id))
      .leftJoin(stylists, eq(bookings.stylistId, stylists.id))
      .where(eq(bookings.salonId, salonId));

    return result
      .filter((r: any) => r.client && r.service)
      .map((r: any) => ({
        ...r.booking,
        client: r.client!,
        service: r.service!,
        stylist: r.stylist,
      }));
  }

  async updateBookingStatus(data: UpdateBookingStatus, salonId: string): Promise<Booking | undefined> {
    const [booking] = await db.update(bookings)
      .set({ status: data.status })
      .where(and(eq(bookings.id, data.id), eq(bookings.salonId, salonId)))
      .returning();
    return booking;
  }

  // Stylist Availability
  async getStylistAvailability(stylistId: string): Promise<StylistAvailability[]> {
    return await db.select()
      .from(stylistAvailability)
      .where(eq(stylistAvailability.stylistId, stylistId));
  }

  async createStylistAvailability(insertAvailability: InsertStylistAvailability): Promise<StylistAvailability> {
    const [availability] = await db.insert(stylistAvailability)
      .values(insertAvailability)
      .returning();
    return availability;
  }

  async updateStylistAvailability(id: number, updateData: Partial<InsertStylistAvailability>): Promise<StylistAvailability | undefined> {
    const [availability] = await db.update(stylistAvailability)
      .set(updateData)
      .where(eq(stylistAvailability.id, id))
      .returning();
    return availability;
  }

  async deleteStylistAvailability(id: number): Promise<boolean> {
    const result = await db.delete(stylistAvailability)
      .where(eq(stylistAvailability.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async setStylistAvailability(stylistId: string, salonId: string, availabilityList: InsertStylistAvailability[]): Promise<StylistAvailability[]> {
    // First verify the stylist belongs to the salon
    const stylist = await this.getStylistById(stylistId);
    if (!stylist || stylist.salonId !== salonId) {
      throw new Error("Stylist not found or access denied");
    }

    // Delete existing availability for this stylist
    await db.delete(stylistAvailability)
      .where(eq(stylistAvailability.stylistId, stylistId));
    
    // Insert new availability
    if (availabilityList.length === 0) {
      return [];
    }
    
    const inserted = await db.insert(stylistAvailability)
      .values(availabilityList)
      .returning();
    return inserted;
  }
}

export const storage = new DbStorage();
