import { 
  type Client, 
  type InsertClient, 
  type Booking, 
  type InsertBooking,
  type BookingWithDetails,
  type Service,
  type Stylist,
  clients,
  bookings,
  services,
  stylists,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Clients
  createClient(client: InsertClient): Promise<Client>;
  getClientById(id: string): Promise<Client | undefined>;
  
  // Services
  getAllServices(): Promise<Service[]>;
  getServiceById(id: string): Promise<Service | undefined>;
  seedServices(): Promise<void>;
  
  // Stylists
  getAllStylists(): Promise<Stylist[]>;
  getStylistById(id: string): Promise<Stylist | undefined>;
  seedStylists(): Promise<void>;
  
  // Bookings
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBookingById(id: string): Promise<BookingWithDetails | undefined>;
  getAllBookings(): Promise<BookingWithDetails[]>;
}

export class DbStorage implements IStorage {
  // Clients
  async createClient(insertClient: InsertClient): Promise<Client> {
    const [client] = await db.insert(clients).values(insertClient).returning();
    return client;
  }

  async getClientById(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  // Services
  async getAllServices(): Promise<Service[]> {
    return await db.select().from(services);
  }

  async getServiceById(id: string): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }

  async seedServices(): Promise<void> {
    const existingServices = await this.getAllServices();
    if (existingServices.length > 0) return;

    await db.insert(services).values([
      {
        id: "haircut",
        name: "Corte de Cabello",
        description: "Corte de cabello profesional y peinado adaptado a tus preferencias",
        duration: "60 min",
        price: 65,
      },
      {
        id: "manicure",
        name: "Manicura",
        description: "Cuidado completo de uñas con limado, pulido y esmaltado",
        duration: "45 min",
        price: 45,
      },
      {
        id: "pedicure",
        name: "Pedicura",
        description: "Tratamiento relajante para pies con exfoliación y cuidado de uñas",
        duration: "60 min",
        price: 55,
      },
    ]);
  }

  // Stylists
  async getAllStylists(): Promise<Stylist[]> {
    return await db.select().from(stylists);
  }

  async getStylistById(id: string): Promise<Stylist | undefined> {
    const [stylist] = await db.select().from(stylists).where(eq(stylists.id, id));
    return stylist;
  }

  async seedStylists(): Promise<void> {
    const existingStylists = await this.getAllStylists();
    if (existingStylists.length > 0) return;

    await db.insert(stylists).values([
      {
        id: "sarah",
        name: "Sarah Johnson",
        specialties: ["Corte", "Color", "Peinado"],
        experience: "8 años",
        rating: 49,
      },
      {
        id: "michael",
        name: "Michael Chen",
        specialties: ["Corte", "Recorte de Barba", "Peinado"],
        experience: "6 años",
        rating: 48,
      },
      {
        id: "emma",
        name: "Emma Davis",
        specialties: ["Manicura", "Pedicura", "Arte de Uñas"],
        experience: "5 años",
        rating: 50,
      },
    ]);
  }

  // Bookings
  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const bookingReference = `BK-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000).toString().padStart(6, '0')}`;
    
    const [booking] = await db.insert(bookings).values({
      ...insertBooking,
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

  async getAllBookings(): Promise<BookingWithDetails[]> {
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
      .leftJoin(stylists, eq(bookings.stylistId, stylists.id));

    return result
      .filter((r: any) => r.client && r.service)
      .map((r: any) => ({
        ...r.booking,
        client: r.client!,
        service: r.service!,
        stylist: r.stylist,
      }));
  }
}

export const storage = new DbStorage();
