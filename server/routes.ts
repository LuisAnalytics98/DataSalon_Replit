import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { seedDemoSalon } from "./seed";
import { 
  insertClientSchema, 
  insertBookingSchema,
  insertServiceSchema,
  insertStylistSchema,
  insertStylistAvailabilitySchema,
  updateBookingStatusSchema,
  insertSalonSchema,
  insertSalonUserSchema,
} from "@shared/schema";
import type { Salon } from "@shared/schema";

// Extend Express types for authentication and salon context
declare global {
  namespace Express {
    interface Request {
      salon?: Salon;
      userRole?: "owner" | "admin" | "employee";
    }
    interface User {
      id?: string;
      email?: string;
      claims?: any;
      access_token?: string;
      refresh_token?: string;
      expires_at?: number;
    }
  }
}

// Middleware to resolve salon from slug parameter
async function resolveSalonSlug(req: Request, res: Response, next: NextFunction) {
  try {
    const salonSlug = req.params.salonSlug;
    if (!salonSlug) {
      return res.status(400).json({ error: "Salon slug is required" });
    }

    const salon = await storage.getSalonBySlug(salonSlug);
    if (!salon) {
      return res.status(404).json({ error: "Salon not found" });
    }

    req.salon = salon;
    next();
  } catch (error) {
    console.error("Error resolving salon:", error);
    res.status(500).json({ error: "Failed to resolve salon" });
  }
}

// Middleware to check user has access to their salon and attach role
async function requireSalonMembership(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userWithSalon = await storage.getUserWithSalon(userId);
    if (!userWithSalon || !userWithSalon.salon) {
      return res.status(403).json({ error: "No salon access" });
    }

    req.salon = userWithSalon.salon;
    req.userRole = userWithSalon.role as "owner" | "admin" | "employee";
    next();
  } catch (error) {
    console.error("Error checking salon membership:", error);
    res.status(500).json({ error: "Failed to verify salon access" });
  }
}

// Middleware to require specific roles
function requireRole(...allowedRoles: Array<"owner" | "admin" | "employee">) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

// Middleware to check if user is super admin
function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const userEmail = req.user?.claims?.email;
  if (!userEmail) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  if (!superAdminEmail) {
    return res.status(500).json({ error: "Super admin not configured" });
  }
  
  if (userEmail !== superAdminEmail) {
    return res.status(403).json({ error: "Super admin access required" });
  }
  
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit authentication
  setupAuth(app);

  // Seed demo salon on startup
  await seedDemoSalon();

  // ===== PUBLIC ROUTES (No auth required, salon-scoped) =====
  
  // Get services for a specific salon (public booking flow)
  app.get("/api/public/:salonSlug/services", resolveSalonSlug, async (req, res) => {
    try {
      const services = await storage.getServicesBySalon(req.salon!.id);
      res.json(services);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch services" });
    }
  });

  // Get stylists for a specific salon (public booking flow)
  app.get("/api/public/:salonSlug/stylists", resolveSalonSlug, async (req, res) => {
    try {
      const stylists = await storage.getStylistsBySalon(req.salon!.id);
      res.json(stylists);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stylists" });
    }
  });

  // Create a booking for a specific salon (public booking flow)
  app.post("/api/public/:salonSlug/bookings", resolveSalonSlug, async (req, res) => {
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

      const booking = await storage.createBooking(bookingData, req.salon!.id);
      const bookingWithDetails = await storage.getBookingById(booking.id);

      res.json(bookingWithDetails);
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(400).json({ error: "Failed to create booking" });
    }
  });

  // Get a specific booking by reference (public - for confirmation page)
  app.get("/api/public/bookings/:id", async (req, res) => {
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

  // ===== ADMIN/EMPLOYEE ROUTES (Auth required, salon-scoped) =====

  // Get salon data for current user
  app.get("/api/admin/salon", isAuthenticated, requireSalonMembership, async (req, res) => {
    try {
      res.json({
        salon: req.salon,
        role: req.userRole,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch salon data" });
    }
  });

  // Get all bookings for user's salon
  app.get("/api/admin/bookings", isAuthenticated, requireSalonMembership, async (req, res) => {
    try {
      const bookings = await storage.getBookingsBySalon(req.salon!.id);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  // Update booking status (admin only)
  app.patch("/api/admin/bookings/:id/status", isAuthenticated, requireSalonMembership, requireRole("owner", "admin"), async (req, res) => {
    try {
      const validatedData = updateBookingStatusSchema.parse({
        id: req.params.id,
        status: req.body.status,
      });
      
      const booking = await storage.updateBookingStatus(validatedData, req.salon!.id);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found or access denied" });
      }
      
      res.json(booking);
    } catch (error) {
      console.error("Error updating booking status:", error);
      res.status(400).json({ error: "Failed to update booking status" });
    }
  });

  // Get services for user's salon
  app.get("/api/admin/services", isAuthenticated, requireSalonMembership, async (req, res) => {
    try {
      const services = await storage.getServicesBySalon(req.salon!.id);
      res.json(services);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch services" });
    }
  });

  // Service management (admin/owner only)
  app.post("/api/admin/services", isAuthenticated, requireSalonMembership, requireRole("owner", "admin"), async (req, res) => {
    try {
      const validatedService = insertServiceSchema.parse({
        ...req.body,
        salonId: req.salon!.id,
      });
      const service = await storage.createService(validatedService);
      res.json(service);
    } catch (error) {
      console.error("Error creating service:", error);
      res.status(400).json({ error: "Failed to create service" });
    }
  });

  app.patch("/api/admin/services/:id", isAuthenticated, requireSalonMembership, requireRole("owner", "admin"), async (req, res) => {
    try {
      const service = await storage.updateService(req.params.id, req.salon!.id, req.body);
      if (!service) {
        return res.status(404).json({ error: "Service not found or access denied" });
      }
      res.json(service);
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(400).json({ error: "Failed to update service" });
    }
  });

  app.delete("/api/admin/services/:id", isAuthenticated, requireSalonMembership, requireRole("owner", "admin"), async (req, res) => {
    try {
      const success = await storage.deleteService(req.params.id, req.salon!.id);
      if (!success) {
        return res.status(404).json({ error: "Service not found or access denied" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ error: "Failed to delete service" });
    }
  });

  // Get stylists for user's salon
  app.get("/api/admin/stylists", isAuthenticated, requireSalonMembership, async (req, res) => {
    try {
      const stylists = await storage.getStylistsBySalon(req.salon!.id);
      res.json(stylists);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stylists" });
    }
  });

  // Stylist management (admin/owner only)
  app.post("/api/admin/stylists", isAuthenticated, requireSalonMembership, requireRole("owner", "admin"), async (req, res) => {
    try {
      const validatedStylist = insertStylistSchema.parse({
        ...req.body,
        salonId: req.salon!.id,
      });
      const stylist = await storage.createStylist(validatedStylist);
      res.json(stylist);
    } catch (error) {
      console.error("Error creating stylist:", error);
      res.status(400).json({ error: "Failed to create stylist" });
    }
  });

  app.patch("/api/admin/stylists/:id", isAuthenticated, requireSalonMembership, requireRole("owner", "admin"), async (req, res) => {
    try {
      const stylist = await storage.updateStylist(req.params.id, req.salon!.id, req.body);
      if (!stylist) {
        return res.status(404).json({ error: "Stylist not found or access denied" });
      }
      res.json(stylist);
    } catch (error) {
      console.error("Error updating stylist:", error);
      res.status(400).json({ error: "Failed to update stylist" });
    }
  });

  app.delete("/api/admin/stylists/:id", isAuthenticated, requireSalonMembership, requireRole("owner", "admin"), async (req, res) => {
    try {
      const success = await storage.deleteStylist(req.params.id, req.salon!.id);
      if (!success) {
        return res.status(404).json({ error: "Stylist not found or access denied" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting stylist:", error);
      res.status(500).json({ error: "Failed to delete stylist" });
    }
  });

  // Stylist availability management (public read for booking, admin write)
  app.get("/api/public/stylists/:id/availability", async (req, res) => {
    try {
      const availability = await storage.getStylistAvailability(req.params.id);
      res.json(availability);
    } catch (error) {
      console.error("Error fetching stylist availability:", error);
      res.status(500).json({ error: "Failed to fetch stylist availability" });
    }
  });

  app.post("/api/admin/stylists/:id/availability", isAuthenticated, requireSalonMembership, requireRole("owner", "admin"), async (req, res) => {
    try {
      const { availability } = req.body;
      
      // Validate each availability slot
      const validatedAvailability = availability.map((slot: any) =>
        insertStylistAvailabilitySchema.parse({
          ...slot,
          stylistId: req.params.id,
        })
      );
      
      const result = await storage.setStylistAvailability(req.params.id, req.salon!.id, validatedAvailability);
      res.json(result);
    } catch (error) {
      console.error("Error setting stylist availability:", error);
      res.status(400).json({ error: "Failed to set stylist availability" });
    }
  });

  // ===== SUPER ADMIN ROUTES (Super admin only) =====
  
  // Get all salons
  app.get("/api/superadmin/salons", isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const salons = await storage.getAllSalons();
      res.json(salons);
    } catch (error) {
      console.error("Error fetching salons:", error);
      res.status(500).json({ error: "Failed to fetch salons" });
    }
  });

  // Create a new salon
  app.post("/api/superadmin/salons", isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const validatedSalon = insertSalonSchema.parse(req.body);
      const salon = await storage.createSalon(validatedSalon);
      res.json(salon);
    } catch (error) {
      console.error("Error creating salon:", error);
      res.status(400).json({ error: "Failed to create salon" });
    }
  });

  // Update a salon
  app.patch("/api/superadmin/salons/:id", isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const salon = await storage.updateSalon(req.params.id, req.body);
      if (!salon) {
        return res.status(404).json({ error: "Salon not found" });
      }
      res.json(salon);
    } catch (error) {
      console.error("Error updating salon:", error);
      res.status(400).json({ error: "Failed to update salon" });
    }
  });

  // Delete a salon
  app.delete("/api/superadmin/salons/:id", isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const success = await storage.deleteSalon(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Salon not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting salon:", error);
      res.status(500).json({ error: "Failed to delete salon" });
    }
  });

  // Get all users
  app.get("/api/superadmin/users", isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Get users for a specific salon
  app.get("/api/superadmin/salons/:id/users", isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const salonUsers = await storage.getSalonUsers(req.params.id);
      res.json(salonUsers);
    } catch (error) {
      console.error("Error fetching salon users:", error);
      res.status(500).json({ error: "Failed to fetch salon users" });
    }
  });

  // Assign user to salon
  app.post("/api/superadmin/salon-users", isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const validatedSalonUser = insertSalonUserSchema.parse(req.body);
      const salonUser = await storage.createSalonUser(validatedSalonUser);
      res.json(salonUser);
    } catch (error) {
      console.error("Error assigning user to salon:", error);
      res.status(400).json({ error: "Failed to assign user to salon" });
    }
  });

  // Remove user from salon
  app.delete("/api/superadmin/salon-users", isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { userId, salonId } = req.body;
      const success = await storage.deleteSalonUser(userId, salonId);
      if (!success) {
        return res.status(404).json({ error: "User assignment not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing user from salon:", error);
      res.status(500).json({ error: "Failed to remove user from salon" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
