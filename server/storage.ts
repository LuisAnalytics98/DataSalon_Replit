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
  type StylistService,
  type InsertStylistService,
  type UpdateBookingStatus,
  type UpdateBookingCompletion,
  type User,
  type UpsertUser,
  type Salon,
  type InsertSalon,
  type SalonUser,
  type InsertSalonUser,
  type UserWithSalon,
  type SalonInquiry,
  type InsertSalonInquiry,
  clients,
  bookings,
  services,
  stylists,
  stylistAvailability,
  stylistServices,
  users,
  salons,
  salonUsers,
  salonInquiries,
} from "../shared/schema.js";
import { db } from "./db.js";
import { eq, and, inArray } from "drizzle-orm";

export interface IStorage {
  // Users (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserWithSalon(userId: string): Promise<UserWithSalon | undefined>;
  
  // Salons
  getSalonById(id: string): Promise<Salon | undefined>;
  getSalonBySlug(slug: string): Promise<Salon | undefined>;
  getAllSalons(): Promise<Salon[]>;
  createSalon(salon: InsertSalon): Promise<Salon>;
  updateSalon(id: string, salon: Partial<InsertSalon>): Promise<Salon | undefined>;
  deleteSalon(id: string): Promise<boolean>;
  
  // Salon Users
  createSalonUser(salonUser: InsertSalonUser): Promise<SalonUser>;
  getUserSalons(userId: string): Promise<SalonUser[]>;
  getSalonUsers(salonId: string): Promise<Array<SalonUser & { user: User | null }>>;
  deleteSalonUser(userId: string, salonId: string): Promise<boolean>;
  
  // Super Admin User Management
  getAllUsers(): Promise<User[]>;
  
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
  getStylistByUserId(userId: string): Promise<Stylist | undefined>;
  createStylist(stylist: InsertStylist): Promise<Stylist>;
  updateStylist(id: string, salonId: string, stylist: Partial<InsertStylist>): Promise<Stylist | undefined>;
  deleteStylist(id: string, salonId: string): Promise<boolean>;
  
  // Bookings (now salon-scoped)
  createBooking(booking: InsertBooking, salonId: string): Promise<Booking>;
  getBookingById(id: string): Promise<BookingWithDetails | undefined>;
  getBookingsBySalon(salonId: string): Promise<BookingWithDetails[]>;
  updateBookingStatus(data: UpdateBookingStatus, salonId: string): Promise<Booking | undefined>;
  updateBookingCompletion(id: string, salonId: string, data: UpdateBookingCompletion): Promise<Booking | undefined>;
  updateBookingToken(id: string, token: string, expiry: Date): Promise<Booking | undefined>;
  confirmBookingByToken(id: string, token: string): Promise<Booking | undefined>;
  cancelBookingByToken(id: string, token: string): Promise<Booking | undefined>;
  
  // Stylist Availability
  getStylistAvailability(stylistId: string): Promise<StylistAvailability[]>;
  createStylistAvailability(availability: InsertStylistAvailability): Promise<StylistAvailability>;
  updateStylistAvailability(id: number, availability: Partial<InsertStylistAvailability>): Promise<StylistAvailability | undefined>;
  deleteStylistAvailability(id: number): Promise<boolean>;
  setStylistAvailability(stylistId: string, salonId: string, availability: InsertStylistAvailability[]): Promise<StylistAvailability[]>;
  
  // Stylist Services (many-to-many relationship)
  getStylistServices(stylistId: string): Promise<Service[]>;
  getServiceStylists(serviceId: string): Promise<Stylist[]>;
  addStylistService(stylistId: string, serviceId: string): Promise<StylistService>;
  removeStylistService(stylistId: string, serviceId: string): Promise<boolean>;
  setStylistServices(stylistId: string, serviceIds: string[]): Promise<Service[]>;
  
  // Salon Inquiries
  createSalonInquiry(inquiry: InsertSalonInquiry): Promise<SalonInquiry>;
  getAllSalonInquiries(): Promise<SalonInquiry[]>;
  updateSalonInquiryStatus(id: string, status: string): Promise<SalonInquiry | undefined>;
  
  // Analytics
  getAnalytics(salonId: string, startDate?: Date, endDate?: Date, stylistId?: string): Promise<any>;
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
        target: users.email,
        set: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
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

  async getAllSalons(): Promise<Salon[]> {
    return await db.select().from(salons);
  }

  async createSalon(insertSalon: InsertSalon): Promise<Salon> {
    const [salon] = await db.insert(salons).values(insertSalon).returning();
    return salon;
  }

  async updateSalon(id: string, updateData: Partial<InsertSalon>): Promise<Salon | undefined> {
    const [salon] = await db.update(salons)
      .set(updateData)
      .where(eq(salons.id, id))
      .returning();
    return salon;
  }

  async deleteSalon(id: string): Promise<boolean> {
    const result = await db.delete(salons).where(eq(salons.id, id)).returning();
    return result.length > 0;
  }

  // Salon Users
  async createSalonUser(insertSalonUser: InsertSalonUser): Promise<SalonUser> {
    const [salonUser] = await db.insert(salonUsers).values(insertSalonUser).returning();
    return salonUser;
  }

  async getUserSalons(userId: string): Promise<SalonUser[]> {
    return await db.select().from(salonUsers).where(eq(salonUsers.userId, userId));
  }

  async getSalonUsers(salonId: string): Promise<Array<SalonUser & { user: User | null }>> {
    const results = await db
      .select({
        salonUser: salonUsers,
        user: users,
      })
      .from(salonUsers)
      .leftJoin(users, eq(salonUsers.userId, users.id))
      .where(eq(salonUsers.salonId, salonId));

    return results.map(r => ({
      ...r.salonUser,
      user: r.user, // Can be null if user doesn't exist
    }));
  }

  async deleteSalonUser(userId: string, salonId: string): Promise<boolean> {
    const result = await db.delete(salonUsers)
      .where(and(eq(salonUsers.userId, userId), eq(salonUsers.salonId, salonId)))
      .returning();
    return result.length > 0;
  }

  // Super Admin User Management
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
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
      .where(and(eq(services.id, id), eq(services.salonId, salonId)))
      .returning();
    return result.length > 0;
  }

  // Stylists (now salon-scoped)
  async getStylistsBySalon(salonId: string): Promise<Stylist[]> {
    return await db.select().from(stylists).where(eq(stylists.salonId, salonId));
  }

  async getStylistById(id: string): Promise<Stylist | undefined> {
    const [stylist] = await db.select().from(stylists).where(eq(stylists.id, id));
    return stylist;
  }

  async getStylistByUserId(userId: string): Promise<Stylist | undefined> {
    const [stylist] = await db.select().from(stylists).where(eq(stylists.userId, userId));
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
      .where(and(eq(stylists.id, id), eq(stylists.salonId, salonId)))
      .returning();
    return result.length > 0;
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

  async updateBookingCompletion(id: string, salonId: string, data: UpdateBookingCompletion): Promise<Booking | undefined> {
    const [booking] = await db.update(bookings)
      .set({ 
        status: data.status,
        finalPrice: data.finalPrice,
      })
      .where(and(eq(bookings.id, id), eq(bookings.salonId, salonId)))
      .returning();
    return booking;
  }

  async updateBookingToken(id: string, token: string, expiry: Date): Promise<Booking | undefined> {
    const [booking] = await db.update(bookings)
      .set({ 
        confirmationToken: token,
        tokenExpiry: expiry,
      })
      .where(eq(bookings.id, id))
      .returning();
    return booking;
  }

  async confirmBookingByToken(id: string, token: string): Promise<Booking | undefined> {
    // Verify token and expiry
    const [existing] = await db.select().from(bookings).where(eq(bookings.id, id));
    
    if (!existing || existing.confirmationToken !== token) {
      return undefined;
    }
    
    if (existing.tokenExpiry && new Date() > existing.tokenExpiry) {
      return undefined; // Token expired
    }
    
    // Update status to confirmed
    const [booking] = await db.update(bookings)
      .set({ 
        status: 'confirmed',
        confirmationToken: null, // Clear token after use
        tokenExpiry: null,
      })
      .where(eq(bookings.id, id))
      .returning();
    return booking;
  }

  async cancelBookingByToken(id: string, token: string): Promise<Booking | undefined> {
    // Verify token and expiry
    const [existing] = await db.select().from(bookings).where(eq(bookings.id, id));
    
    if (!existing || existing.confirmationToken !== token) {
      return undefined;
    }
    
    if (existing.tokenExpiry && new Date() > existing.tokenExpiry) {
      return undefined; // Token expired
    }
    
    // Update status to cancelled
    const [booking] = await db.update(bookings)
      .set({ 
        status: 'cancelled',
        confirmationToken: null, // Clear token after use
        tokenExpiry: null,
      })
      .where(eq(bookings.id, id))
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
      .where(eq(stylistAvailability.id, id))
      .returning();
    return result.length > 0;
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

    // Stylist Services (many-to-many relationship)
    async getStylistServices(stylistId: string): Promise<Service[]> {
      const results = await db
        .select({
          service: services,
        })
        .from(stylistServices)
        .innerJoin(services, eq(stylistServices.serviceId, services.id))
        .where(eq(stylistServices.stylistId, stylistId));
      
      return results.map(r => r.service);
    }

    async getServiceStylists(serviceId: string): Promise<Stylist[]> {
      const results = await db
        .select({
          stylist: stylists,
        })
        .from(stylistServices)
        .innerJoin(stylists, eq(stylistServices.stylistId, stylists.id))
        .where(eq(stylistServices.serviceId, serviceId));
      
      return results.map(r => r.stylist);
    }

    async addStylistService(stylistId: string, serviceId: string): Promise<StylistService> {
      // Check if relationship already exists
      const existing = await db
        .select()
        .from(stylistServices)
        .where(and(
          eq(stylistServices.stylistId, stylistId),
          eq(stylistServices.serviceId, serviceId)
        ));
      
      if (existing.length > 0) {
        return existing[0];
      }

      const [stylistService] = await db
        .insert(stylistServices)
        .values({ stylistId, serviceId })
        .returning();
      
      return stylistService;
    }

    async removeStylistService(stylistId: string, serviceId: string): Promise<boolean> {
      const result = await db
        .delete(stylistServices)
        .where(and(
          eq(stylistServices.stylistId, stylistId),
          eq(stylistServices.serviceId, serviceId)
        ))
        .returning();
      
      return result.length > 0;
    }

    async setStylistServices(stylistId: string, serviceIds: string[]): Promise<Service[]> {
      // Delete existing relationships
      await db
        .delete(stylistServices)
        .where(eq(stylistServices.stylistId, stylistId));
      
      // Insert new relationships
      if (serviceIds.length === 0) {
        return [];
      }

      await db
        .insert(stylistServices)
        .values(serviceIds.map(serviceId => ({ stylistId, serviceId })));
      
      // Return the updated list of services
      return await this.getStylistServices(stylistId);
    }

    // Salon Inquiries
    async createSalonInquiry(inquiry: InsertSalonInquiry): Promise<SalonInquiry> {
      const [salonInquiry] = await db.insert(salonInquiries).values(inquiry).returning();
      return salonInquiry;
    }

  async getAllSalonInquiries(): Promise<SalonInquiry[]> {
    return await db.select().from(salonInquiries);
  }

  async updateSalonInquiryStatus(id: string, status: string): Promise<SalonInquiry | undefined> {
    const [inquiry] = await db.update(salonInquiries)
      .set({ status })
      .where(eq(salonInquiries.id, id))
      .returning();
    return inquiry;
  }

  // Analytics
  async getAnalytics(salonId: string, startDate?: Date, endDate?: Date, stylistId?: string): Promise<any> {
    // Fetch all bookings for the salon, optionally filtered by date range and stylist
    let bookingsQuery = db
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
    
    const allBookings = await bookingsQuery;
    
    // Filter by date range and stylist if provided
    const filteredBookings = allBookings.filter(row => {
      if (!row.booking.appointmentDate) return false;
      const bookingDate = new Date(row.booking.appointmentDate);
      if (startDate && bookingDate < startDate) return false;
      if (endDate && bookingDate > endDate) return false;
      if (stylistId && row.booking.stylistId !== stylistId) return false;
      return true;
    });

    // Calculate total revenue (only completed bookings with finalPrice)
    const totalRevenue = filteredBookings
      .filter(row => row.booking.status === "done" && row.booking.finalPrice)
      .reduce((sum, row) => sum + (row.booking.finalPrice || 0), 0);

    // Count total bookings
    const totalBookings = filteredBookings.length;

    // Count completed bookings
    const completedBookings = filteredBookings.filter(row => row.booking.status === "done").length;

    // Average ticket size
    const completedWithPrice = filteredBookings.filter(row => 
      row.booking.status === "done" && row.booking.finalPrice
    );
    const averageTicket = completedWithPrice.length > 0
      ? totalRevenue / completedWithPrice.length
      : 0;

    // Popular services (top 5)
    const serviceStats: { [key: string]: { name: string; count: number; revenue: number } } = {};
    filteredBookings.forEach(row => {
      if (!row.service) return;
      const serviceId = row.service.id;
      if (!serviceStats[serviceId]) {
        serviceStats[serviceId] = {
          name: row.service.name,
          count: 0,
          revenue: 0,
        };
      }
      serviceStats[serviceId].count++;
      if (row.booking.status === "done" && row.booking.finalPrice) {
        serviceStats[serviceId].revenue += row.booking.finalPrice;
      }
    });
    const popularServices = Object.values(serviceStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Stylist performance (top 5)
    const stylistStats: { [key: string]: { name: string; bookings: number; revenue: number } } = {};
    filteredBookings.forEach(row => {
      if (!row.stylist) return;
      const stylistId = row.stylist.id;
      if (!stylistStats[stylistId]) {
        stylistStats[stylistId] = {
          name: row.stylist.name,
          bookings: 0,
          revenue: 0,
        };
      }
      stylistStats[stylistId].bookings++;
      if (row.booking.status === "done" && row.booking.finalPrice) {
        stylistStats[stylistId].revenue += row.booking.finalPrice;
      }
    });
    const topStylists = Object.values(stylistStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Top clients (top 5)
    const clientStats: { [key: string]: { name: string; email: string; bookings: number; revenue: number } } = {};
    filteredBookings.forEach(row => {
      if (!row.client) return;
      const clientId = row.client.id;
      if (!clientStats[clientId]) {
        clientStats[clientId] = {
          name: row.client.name,
          email: row.client.email,
          bookings: 0,
          revenue: 0,
        };
      }
      clientStats[clientId].bookings++;
      if (row.booking.status === "done" && row.booking.finalPrice) {
        clientStats[clientId].revenue += row.booking.finalPrice;
      }
    });
    const topClients = Object.values(clientStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Revenue by service (for breakdown)
    const revenueByService = Object.values(serviceStats)
      .filter(s => s.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue);

    // Status breakdown
    const statusBreakdown = {
      pending: filteredBookings.filter(row => row.booking.status === "pending").length,
      confirmed: filteredBookings.filter(row => row.booking.status === "confirmed").length,
      in_progress: filteredBookings.filter(row => row.booking.status === "in_progress").length,
      done: filteredBookings.filter(row => row.booking.status === "done").length,
      cancelled: filteredBookings.filter(row => row.booking.status === "cancelled").length,
    };

    return {
      summary: {
        totalRevenue,
        totalBookings,
        completedBookings,
        averageTicket: Math.round(averageTicket),
      },
      popularServices,
      topStylists,
      topClients,
      revenueByService,
      statusBreakdown,
    };
  }
}

export const storage = new DbStorage();
