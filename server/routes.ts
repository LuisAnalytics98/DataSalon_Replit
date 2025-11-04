import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertClientSchema, 
  insertBookingSchema,
  insertServiceSchema,
  insertStylistSchema,
  insertStylistAvailabilitySchema,
  updateBookingStatusSchema,
} from "@shared/schema";

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

  // ===== ADMIN ROUTES =====

  // Update booking status
  app.patch("/api/admin/bookings/:id/status", async (req, res) => {
    try {
      const validatedData = updateBookingStatusSchema.parse({
        id: req.params.id,
        status: req.body.status,
      });
      
      const booking = await storage.updateBookingStatus(validatedData);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      res.json(booking);
    } catch (error) {
      console.error("Error updating booking status:", error);
      res.status(400).json({ error: "Failed to update booking status" });
    }
  });

  // Service management
  app.post("/api/admin/services", async (req, res) => {
    try {
      const validatedService = insertServiceSchema.parse(req.body);
      const service = await storage.createService(validatedService);
      res.json(service);
    } catch (error) {
      console.error("Error creating service:", error);
      res.status(400).json({ error: "Failed to create service" });
    }
  });

  app.patch("/api/admin/services/:id", async (req, res) => {
    try {
      const service = await storage.updateService(req.params.id, req.body);
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(400).json({ error: "Failed to update service" });
    }
  });

  app.delete("/api/admin/services/:id", async (req, res) => {
    try {
      const success = await storage.deleteService(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Service not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ error: "Failed to delete service" });
    }
  });

  // Stylist management
  app.post("/api/admin/stylists", async (req, res) => {
    try {
      const validatedStylist = insertStylistSchema.parse(req.body);
      const stylist = await storage.createStylist(validatedStylist);
      res.json(stylist);
    } catch (error) {
      console.error("Error creating stylist:", error);
      res.status(400).json({ error: "Failed to create stylist" });
    }
  });

  app.patch("/api/admin/stylists/:id", async (req, res) => {
    try {
      const stylist = await storage.updateStylist(req.params.id, req.body);
      if (!stylist) {
        return res.status(404).json({ error: "Stylist not found" });
      }
      res.json(stylist);
    } catch (error) {
      console.error("Error updating stylist:", error);
      res.status(400).json({ error: "Failed to update stylist" });
    }
  });

  app.delete("/api/admin/stylists/:id", async (req, res) => {
    try {
      const success = await storage.deleteStylist(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Stylist not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting stylist:", error);
      res.status(500).json({ error: "Failed to delete stylist" });
    }
  });

  // Stylist availability management
  app.get("/api/stylists/:id/availability", async (req, res) => {
    try {
      const availability = await storage.getStylistAvailability(req.params.id);
      res.json(availability);
    } catch (error) {
      console.error("Error fetching stylist availability:", error);
      res.status(500).json({ error: "Failed to fetch stylist availability" });
    }
  });

  app.post("/api/admin/stylists/:id/availability", async (req, res) => {
    try {
      const { availability } = req.body;
      
      // Validate each availability slot
      const validatedAvailability = availability.map((slot: any) =>
        insertStylistAvailabilitySchema.parse({
          ...slot,
          stylistId: req.params.id,
        })
      );
      
      const result = await storage.setStylistAvailability(req.params.id, validatedAvailability);
      res.json(result);
    } catch (error) {
      console.error("Error setting stylist availability:", error);
      res.status(400).json({ error: "Failed to set stylist availability" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
