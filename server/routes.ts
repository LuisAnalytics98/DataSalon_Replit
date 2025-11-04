import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertClientSchema, insertBookingSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Seed initial data
  await storage.seedServices();
  await storage.seedStylists();

  // Get all services
  app.get("/api/services", async (_req, res) => {
    try {
      const services = await storage.getAllServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch services" });
    }
  });

  // Get all stylists
  app.get("/api/stylists", async (_req, res) => {
    try {
      const stylists = await storage.getAllStylists();
      res.json(stylists);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stylists" });
    }
  });

  // Create a booking
  app.post("/api/bookings", async (req, res) => {
    try {
      const { clientInfo, serviceId, stylistId, date, time } = req.body;

      // Validate client info
      const validatedClient = insertClientSchema.parse(clientInfo);

      // Create client
      const client = await storage.createClient(validatedClient);

      // Create booking
      const appointmentDate = new Date(date);
      const bookingData = insertBookingSchema.parse({
        clientId: client.id,
        serviceId,
        stylistId: stylistId === "any" ? null : stylistId,
        appointmentDate,
        appointmentTime: time,
      });

      const booking = await storage.createBooking(bookingData);
      const bookingWithDetails = await storage.getBookingById(booking.id);

      res.json(bookingWithDetails);
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(400).json({ error: "Failed to create booking" });
    }
  });

  // Get a booking by ID
  app.get("/api/bookings/:id", async (req, res) => {
    try {
      const booking = await storage.getBookingById(req.params.id);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch booking" });
    }
  });

  // Get all bookings
  app.get("/api/bookings", async (_req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
