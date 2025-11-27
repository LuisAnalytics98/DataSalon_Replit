import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
// Use Supabase Auth instead of Replit Auth
import { setupAuth, isAuthenticated, supabaseAdmin } from "./supabaseAuth.js";
import { seedDemoSalon, ensureUserHasDemoSalonAccess } from "./seed.js";
import { 
  insertClientSchema, 
  insertBookingSchema,
  insertServiceSchema,
  insertStylistSchema,
  insertStylistAvailabilitySchema,
  updateBookingStatusSchema,
  updateBookingCompletionSchema,
  insertSalonSchema,
  insertSalonUserSchema,
  insertSalonInquirySchema,
} from "../shared/schema.js";
import type { Salon, InsertSalon } from "../shared/schema.js";
// Use Supabase Storage instead of Replit Object Storage
import { supabaseStorage, ObjectNotFoundError } from "./supabaseStorage.js";
import { ObjectPermission } from "./objectAcl.js";
import { sendBookingConfirmationEmail } from "./emailService.js";
import crypto from "crypto";

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
    // Supabase auth: user ID is directly on req.user.id
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Auto-link new users to demo salon during development/testing
    if (process.env.NODE_ENV === "development") {
      await ensureUserHasDemoSalonAccess(userId);
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
  // Supabase auth: email is directly on req.user.email
  const userEmail = req.user?.email;
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
  // Setup Supabase authentication
  await setupAuth(app);

  // Seed demo salon on startup
  await seedDemoSalon();

  // ===== PUBLIC ROUTES (No auth required, salon-scoped) =====
  
  // Get salon info by slug (public booking flow)
  app.get("/api/public/:salonSlug", resolveSalonSlug, async (req, res) => {
    try{
      res.json(req.salon);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch salon" });
    }
  });

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
    // Optional query param: serviceId - filters to only stylists who offer that service
    app.get("/api/public/:salonSlug/stylists", resolveSalonSlug, async (req, res) => {
      try {
        const { serviceId } = req.query;
        
        if (serviceId && typeof serviceId === 'string') {
          // Get only stylists who offer this specific service
          const stylists = await storage.getServiceStylists(serviceId);
          // Filter to ensure they belong to this salon
          const salonStylists = stylists.filter(s => s.salonId === req.salon!.id);
          res.json(salonStylists);
        } else {
          // Return all stylists for the salon
          const stylists = await storage.getStylistsBySalon(req.salon!.id);
          res.json(stylists);
        }
      } catch (error) {
        console.error("Error fetching stylists:", error);
        res.status(500).json({ error: "Failed to fetch stylists" });
      }
    });

  // Helper function to convert time string (HH:mm or "9:00 AM") to minutes since midnight
  const timeToMinutes = (timeStr: string): number => {
    // Handle 24-hour format (HH:mm)
    if (timeStr.includes(':') && !timeStr.includes('AM') && !timeStr.includes('PM')) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    }
    // Handle 12-hour format (9:00 AM)
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  // Helper function to check if two time ranges overlap
  // Uses [start, end) semantics where end is exclusive
  // This allows back-to-back bookings where end1 == start2 (no overlap)
  // Two ranges [start1, end1) and [start2, end2) overlap if:
  //   start1 < end2 AND start2 < end1
  const timeRangesOverlap = (
    start1: number, end1: number,
    start2: number, end2: number
  ): boolean => {
    // Two ranges overlap if start1 < end2 AND start2 < end1
    // Example: [10, 20) and [20, 30) don't overlap (back-to-back allowed)
    //          [10, 20) and [15, 25) do overlap
    return start1 < end2 && start2 < end1;
  };

  // Create a booking for a specific salon (public booking flow)
  app.post("/api/public/:salonSlug/bookings", resolveSalonSlug, async (req, res) => {
    try {
      const { clientInfo, serviceId, stylistId, date, time } = req.body;

      // Get service to know its duration
      const service = await storage.getServiceById(serviceId);
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }

      // Check if time slot is available (if stylist is specified)
      if (stylistId && stylistId !== "any") {
        const appointmentDate = new Date(date);
        const existingBookings = await storage.getBookingsBySalon(req.salon!.id);
        
        // Convert new booking time to minutes
        // Booking reserves [start_at, end_at) where end_at is exclusive
        const newBookingStartMinutes = timeToMinutes(time);
        const newBookingDuration = service.duration;
        const newBookingEndMinutes = newBookingStartMinutes + newBookingDuration;
        
        // Check for conflicts with existing bookings for this stylist on the same date
        // A booking must reserve [start_at, end_at) for a specific employee_id
        // New bookings must not overlap existing bookings for the same employee_id
        // Back-to-back bookings are allowed where end_at == next_start_at
        const hasConflict = existingBookings.some((booking: any) => {
          // Skip cancelled bookings
          if (booking.status === "cancelled") return false;
          // Only check bookings for the same stylist
          if (booking.stylistId !== stylistId) return false;
          
          // Only check bookings on the same date
          const bookingDate = new Date(booking.appointmentDate);
          if (bookingDate.toDateString() !== appointmentDate.toDateString()) return false;
          
          // Get existing booking's service duration
          const existingBookingDuration = booking.service?.duration || 60; // Default to 60 if not available
          const existingBookingStartMinutes = timeToMinutes(booking.appointmentTime);
          const existingBookingEndMinutes = existingBookingStartMinutes + existingBookingDuration;
          
          // Check if time ranges overlap using [start, end) semantics
          // This prevents overlaps while allowing back-to-back bookings
          return timeRangesOverlap(
            newBookingStartMinutes, newBookingEndMinutes,
            existingBookingStartMinutes, existingBookingEndMinutes
          );
        });

        if (hasConflict) {
          return res.status(409).json({ 
            error: "Este horario ya no está disponible. Por favor selecciona otro horario." 
          });
        }
      }

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
      
      // Generate confirmation token
      const confirmToken = crypto.randomBytes(32).toString('hex');
      const tokenExpiry = new Date();
      tokenExpiry.setHours(tokenExpiry.getHours() + 48); // Token expires in 48 hours
      
      await storage.updateBookingToken(booking.id, confirmToken, tokenExpiry);
      
      const bookingWithDetails = await storage.getBookingById(booking.id);

      // Send confirmation email asynchronously (don't block response)
      if (bookingWithDetails) {
        sendBookingConfirmationEmail(bookingWithDetails, req.salon!, confirmToken)
          .then(() => {
            console.log(`✅ Booking confirmation emails sent successfully for booking ${booking.id}`);
          })
          .catch(err => {
            console.error('❌ Error sending confirmation email:', {
              error: err.message || err,
              stack: err.stack,
              bookingId: booking.id,
              clientEmail: bookingWithDetails.client?.email,
              salonId: req.salon!.id,
            });
            // Log detailed error information
            if (err.response) {
              console.error('Resend API Error Response:', JSON.stringify(err.response, null, 2));
            }
            if (err.message) {
              console.error('Error Message:', err.message);
            }
            // Don't throw - booking is already created, email failure shouldn't break the flow
          });
        } else {
          console.warn('⚠️ Booking created but bookingWithDetails is null, cannot send email');
        }

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

  // Create a salon inquiry (public - landing page contact form)
  app.post("/api/public/inquiries", async (req, res) => {
    try {
      const validatedInquiry = insertSalonInquirySchema.parse(req.body);
      const inquiry = await storage.createSalonInquiry(validatedInquiry);
      res.json(inquiry);
    } catch (error) {
      console.error("Error creating inquiry:", error);
      res.status(400).json({ error: "Failed to create inquiry" });
    }
  });

  // Confirm booking via email link (public)
  app.get("/api/bookings/:id/confirm", async (req, res) => {
    try {
      const { id } = req.params;
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).send(`
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Error - Token Inválido</title>
            <style>
              body { font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background-color: #f8f9fa; }
              .container { max-width: 500px; background: white; padding: 40px; border-radius: 8px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              h1 { color: #dc3545; margin-bottom: 20px; }
              p { color: #666; line-height: 1.6; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>❌ Token Inválido</h1>
              <p>El enlace de confirmación es inválido. Por favor contacta al salón.</p>
            </div>
          </body>
          </html>
        `);
      }
      
      const booking = await storage.confirmBookingByToken(id, token);
      
      if (!booking) {
        return res.status(400).send(`
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Error - Enlace Expirado</title>
            <style>
              body { font-family: 'Inter', sans-serif; display: flex; justify-center; align-items: center; min-height: 100vh; margin: 0; background-color: #f8f9fa; }
              .container { max-width: 500px; background: white; padding: 40px; border-radius: 8px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              h1 { color: #dc3545; margin-bottom: 20px; }
              p { color: #666; line-height: 1.6; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>⏱️ Enlace Expirado</h1>
              <p>Este enlace de confirmación ha expirado o ya ha sido utilizado. Por favor contacta al salón para más ayuda.</p>
            </div>
          </body>
          </html>
        `);
      }
      
      res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Cita Confirmada</title>
          <style>
            body { font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background-color: #f8f9fa; }
            .container { max-width: 500px; background: white; padding: 40px; border-radius: 8px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #28a745; margin-bottom: 20px; font-family: 'Playfair Display', serif; }
            .icon { font-size: 64px; margin-bottom: 20px; }
            p { color: #666; line-height: 1.6; margin-bottom: 15px; }
            .reference { background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin-top: 20px; }
            .reference strong { color: #1a1a1a; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">✅</div>
            <h1>¡Cita Confirmada!</h1>
            <p>Tu cita ha sido confirmada exitosamente.</p>
            <div class="reference">
              <strong>Referencia: ${booking.bookingReference}</strong>
            </div>
            <p style="margin-top: 20px; font-size: 14px; color: #999;">Recibirás un recordatorio antes de tu cita.</p>
          </div>
        </body>
        </html>
      `);
    } catch (error) {
      console.error("Error confirming booking:", error);
      res.status(500).send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Error</title>
          <style>
            body { font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background-color: #f8f9fa; }
            .container { max-width: 500px; background: white; padding: 40px; border-radius: 8px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #dc3545; margin-bottom: 20px; }
            p { color: #666; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Error</h1>
            <p>Hubo un error al confirmar tu cita. Por favor intenta nuevamente o contacta al salón.</p>
          </div>
        </body>
        </html>
      `);
    }
  });

  // Cancel booking via email link (public)
  app.get("/api/bookings/:id/cancel", async (req, res) => {
    try {
      const { id } = req.params;
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).send(`
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Error - Token Inválido</title>
            <style>
              body { font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background-color: #f8f9fa; }
              .container { max-width: 500px; background: white; padding: 40px; border-radius: 8px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              h1 { color: #dc3545; margin-bottom: 20px; }
              p { color: #666; line-height: 1.6; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>❌ Token Inválido</h1>
              <p>El enlace de cancelación es inválido. Por favor contacta al salón.</p>
            </div>
          </body>
          </html>
        `);
      }
      
      const booking = await storage.cancelBookingByToken(id, token);
      
      if (!booking) {
        return res.status(400).send(`
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Error - Enlace Expirado</title>
            <style>
              body { font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background-color: #f8f9fa; }
              .container { max-width: 500px; background: white; padding: 40px; border-radius: 8px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              h1 { color: #dc3545; margin-bottom: 20px; }
              p { color: #666; line-height: 1.6; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>⏱️ Enlace Expirado</h1>
              <p>Este enlace de cancelación ha expirado o ya ha sido utilizado. Por favor contacta al salón para más ayuda.</p>
            </div>
          </body>
          </html>
        `);
      }
      
      res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Cita Cancelada</title>
          <style>
            body { font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background-color: #f8f9fa; }
            .container { max-width: 500px; background: white; padding: 40px; border-radius: 8px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #666; margin-bottom: 20px; font-family: 'Playfair Display', serif; }
            .icon { font-size: 64px; margin-bottom: 20px; }
            p { color: #666; line-height: 1.6; margin-bottom: 15px; }
            .reference { background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin-top: 20px; }
            .reference strong { color: #1a1a1a; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">✅</div>
            <h1>Cita Cancelada</h1>
            <p>Tu cita ha sido cancelada exitosamente.</p>
            <div class="reference">
              <strong>Referencia: ${booking.bookingReference}</strong>
            </div>
            <p style="margin-top: 20px; font-size: 14px; color: #999;">Si deseas reagendar, por favor visita nuestro sitio web.</p>
          </div>
        </body>
        </html>
      `);
    } catch (error) {
      console.error("Error canceling booking:", error);
      res.status(500).send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Error</title>
          <style>
            body { font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background-color: #f8f9fa; }
            .container { max-width: 500px; background: white; padding: 40px; border-radius: 8px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #dc3545; margin-bottom: 20px; }
            p { color: #666; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Error</h1>
            <p>Hubo un error al cancelar tu cita. Por favor intenta nuevamente o contacta al salón.</p>
          </div>
        </body>
        </html>
      `);
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

  // Update salon settings (owner/admin only)
  app.patch("/api/admin/salon", isAuthenticated, requireSalonMembership, requireRole("owner", "admin"), async (req, res) => {
    try {
      const { name, description, phone, email, location, whatsappNumber, instagramUrl, facebookUrl } = req.body;
      const updateData: Partial<InsertSalon> = {};
      
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (phone !== undefined) updateData.phone = phone;
      if (email !== undefined) updateData.email = email;
      if (location !== undefined) updateData.location = location;
      if (whatsappNumber !== undefined) updateData.whatsappNumber = whatsappNumber;
      if (instagramUrl !== undefined) updateData.instagramUrl = instagramUrl;
      if (facebookUrl !== undefined) updateData.facebookUrl = facebookUrl;

      const salon = await storage.updateSalon(req.salon!.id, updateData);
      if (!salon) {
        return res.status(404).json({ error: "Salon not found" });
      }
      res.json(salon);
    } catch (error) {
      console.error("Error updating salon:", error);
      res.status(500).json({ error: "Failed to update salon" });
    }
  });

  // Get users assigned to current salon (for linking to stylists)
  app.get("/api/admin/users", isAuthenticated, requireSalonMembership, async (req, res) => {
    try {
      const salonUsers = await storage.getSalonUsers(req.salon!.id);
      res.json(salonUsers);
    } catch (error) {
      console.error("Error fetching salon users:", error);
      res.status(500).json({ error: "Failed to fetch salon users" });
    }
  });

  // Get current user's stylist profile (if exists)
  app.get("/api/admin/my-stylist", isAuthenticated, requireSalonMembership, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const stylist = await storage.getStylistByUserId(userId);
      res.json(stylist || null);
    } catch (error) {
      console.error("Error fetching user stylist:", error);
      res.status(500).json({ error: "Failed to fetch stylist profile" });
    }
  });

  // Get all bookings for user's salon (employees see only their bookings)
  app.get("/api/admin/bookings", isAuthenticated, requireSalonMembership, async (req, res) => {
    try {
      let bookings = await storage.getBookingsBySalon(req.salon!.id);
      
      // If user is an employee, filter to only their bookings
      if (req.userRole === "employee") {
        const userId = req.user?.id;
        if (userId) {
          const stylist = await storage.getStylistByUserId(userId);
          if (stylist) {
            bookings = bookings.filter(booking => booking.stylistId === stylist.id);
          } else {
            // Employee has no stylist record, return empty array
            bookings = [];
          }
        }
      }
      
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

  // Update booking completion with final price (employee/admin)
  app.patch("/api/admin/bookings/:id/completion", isAuthenticated, requireSalonMembership, async (req, res) => {
    try {
      const validatedData = updateBookingCompletionSchema.parse(req.body);
      
      const booking = await storage.updateBookingCompletion(req.params.id, req.salon!.id, validatedData);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found or access denied" });
      }
      
      res.json(booking);
    } catch (error) {
      console.error("Error updating booking completion:", error);
      res.status(400).json({ error: "Failed to update booking completion" });
    }
  });

  // Get analytics for admin dashboard (admin/owner only)
  app.get("/api/admin/analytics", isAuthenticated, requireSalonMembership, requireRole("owner", "admin"), async (req, res) => {
    try {
      const { startDate, endDate, stylistId } = req.query;
      const salonId = req.salon!.id;
      
      const analytics = await storage.getAnalytics(
        salonId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined,
        stylistId as string | undefined
      );
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
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
      const stylistId = req.params.id;
      const { date, salonId, salonSlug } = req.query;
      
      // Get base availability schedule
      const availability = await storage.getStylistAvailability(stylistId);
      
      // If date and salonId/salonSlug are provided, filter out booked time slots
      if (date && (salonId || salonSlug)) {
        const appointmentDate = new Date(date as string);
        
        // Get salonId from slug if needed
        let resolvedSalonId = salonId as string;
        if (!resolvedSalonId && salonSlug) {
          const salon = await storage.getSalonBySlug(salonSlug as string);
          if (!salon) {
            return res.status(404).json({ error: "Salon not found" });
          }
          resolvedSalonId = salon.id;
        }
        
        const allBookings = await storage.getBookingsBySalon(resolvedSalonId);
        
        // Get bookings for this stylist on this date and calculate blocked time ranges
        const blockedRanges = allBookings
          .filter((booking: any) => {
            const bookingDate = new Date(booking.appointmentDate);
            return (
              booking.stylistId === stylistId &&
              bookingDate.toDateString() === appointmentDate.toDateString() &&
              booking.status !== "cancelled"
            );
          })
          .map((booking: any) => {
            const bookingStartMinutes = timeToMinutes(booking.appointmentTime);
            const bookingDuration = booking.service?.duration || 60; // Default to 60 minutes if not available
            const bookingEndMinutes = bookingStartMinutes + bookingDuration;
            
            return {
              start: booking.appointmentTime, // Keep original format for backward compatibility
              startMinutes: bookingStartMinutes,
              endMinutes: bookingEndMinutes,
              duration: bookingDuration,
            };
          });
        
        // Also return bookedSlots for backward compatibility (exact time matches)
        const bookedSlots = blockedRanges.map((range: any) => range.start);
        
        res.json({ 
          availability, 
          bookedSlots, // Backward compatibility
          blockedRanges, // New: duration-based blocking
        });
      } else {
        res.json(availability);
      }
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

    // Stylist Services management (many-to-many relationship)
    // Get services for a specific stylist
    app.get("/api/admin/stylists/:id/services", isAuthenticated, requireSalonMembership, async (req, res) => {
      try {
        const stylistId = req.params.id;
        
        // Verify stylist belongs to salon
        const stylist = await storage.getStylistById(stylistId);
        if (!stylist || stylist.salonId !== req.salon!.id) {
          return res.status(404).json({ error: "Stylist not found or access denied" });
        }
        
        const services = await storage.getStylistServices(stylistId);
        res.json(services);
      } catch (error) {
        console.error("Error fetching stylist services:", error);
        res.status(500).json({ error: "Failed to fetch stylist services" });
      }
    });

    // Get stylists for a specific service
    app.get("/api/admin/services/:id/stylists", isAuthenticated, requireSalonMembership, async (req, res) => {
      try {
        const serviceId = req.params.id;
        
        // Verify service belongs to salon
        const service = await storage.getServiceById(serviceId);
        if (!service || service.salonId !== req.salon!.id) {
          return res.status(404).json({ error: "Service not found or access denied" });
        }
        
        const stylists = await storage.getServiceStylists(serviceId);
        res.json(stylists);
      } catch (error) {
        console.error("Error fetching service stylists:", error);
        res.status(500).json({ error: "Failed to fetch service stylists" });
      }
    });

    // Set services for a stylist (replace all existing relationships)
    app.post("/api/admin/stylists/:id/services", isAuthenticated, requireSalonMembership, requireRole("owner", "admin"), async (req, res) => {
      try {
        const stylistId = req.params.id;
        const { serviceIds } = req.body;
        
        if (!Array.isArray(serviceIds)) {
          return res.status(400).json({ error: "serviceIds must be an array" });
        }
        
        // Verify stylist belongs to salon
        const stylist = await storage.getStylistById(stylistId);
        if (!stylist || stylist.salonId !== req.salon!.id) {
          return res.status(404).json({ error: "Stylist not found or access denied" });
        }
        
        // Verify all services belong to salon
        const allServices = await storage.getServicesBySalon(req.salon!.id);
        const validServiceIds = allServices.map(s => s.id);
        const invalidServiceIds = serviceIds.filter((id: string) => !validServiceIds.includes(id));
        
        if (invalidServiceIds.length > 0) {
          return res.status(400).json({ 
            error: "Some services do not belong to this salon",
            invalidServiceIds 
          });
        }
        
        const services = await storage.setStylistServices(stylistId, serviceIds);
        res.json(services);
      } catch (error) {
        console.error("Error setting stylist services:", error);
        res.status(400).json({ error: "Failed to set stylist services" });
      }
    });

    // Add a service to a stylist
    app.post("/api/admin/stylists/:id/services/:serviceId", isAuthenticated, requireSalonMembership, requireRole("owner", "admin"), async (req, res) => {
      try {
        const stylistId = req.params.id;
        const serviceId = req.params.serviceId;
        
        // Verify stylist belongs to salon
        const stylist = await storage.getStylistById(stylistId);
        if (!stylist || stylist.salonId !== req.salon!.id) {
          return res.status(404).json({ error: "Stylist not found or access denied" });
        }
        
        // Verify service belongs to salon
        const service = await storage.getServiceById(serviceId);
        if (!service || service.salonId !== req.salon!.id) {
          return res.status(404).json({ error: "Service not found or access denied" });
        }
        
        const stylistService = await storage.addStylistService(stylistId, serviceId);
        res.json(stylistService);
      } catch (error) {
        console.error("Error adding stylist service:", error);
        res.status(400).json({ error: "Failed to add stylist service" });
      }
    });

    // Remove a service from a stylist
    app.delete("/api/admin/stylists/:id/services/:serviceId", isAuthenticated, requireSalonMembership, requireRole("owner", "admin"), async (req, res) => {
      try {
        const stylistId = req.params.id;
        const serviceId = req.params.serviceId;
        
        // Verify stylist belongs to salon
        const stylist = await storage.getStylistById(stylistId);
        if (!stylist || stylist.salonId !== req.salon!.id) {
          return res.status(404).json({ error: "Stylist not found or access denied" });
        }
        
        const success = await storage.removeStylistService(stylistId, serviceId);
        if (!success) {
          return res.status(404).json({ error: "Service relationship not found" });
        }
        
        res.json({ success: true });
      } catch (error) {
        console.error("Error removing stylist service:", error);
        res.status(400).json({ error: "Failed to remove stylist service" });
      }
    });

    // ===== OBJECT STORAGE ROUTES (Protected file uploads, auth required) =====
  
  // Get presigned upload URL for object entity
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    try {
      const uploadURL = await supabaseStorage.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Serve uploaded images with ACL check
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req, res) => {
    const userId = req.user?.id;
    try {
      const objectPath = await supabaseStorage.getObjectEntityPath(req.path);
      const canAccess = await supabaseStorage.canAccessObjectEntity({
        objectPath: req.path,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      // Download object (isPublic determined by bucket policy)
      await supabaseStorage.downloadObject(objectPath, res, 3600, true);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Save service image URL after upload
  app.put("/api/admin/services/:id/image", isAuthenticated, requireSalonMembership, requireRole("owner", "admin"), async (req, res) => {
    try {
      if (!req.body.imageUrl) {
        return res.status(400).json({ error: "imageUrl is required" });
      }

      const userId = req.user?.id;
      let objectPath = req.body.imageUrl;
      
      // Set ACL policy for the uploaded image (public visibility for service images)
      if (userId) {
        objectPath = await supabaseStorage.trySetObjectEntityAclPolicy(
          req.body.imageUrl,
          {
            owner: userId,
            visibility: "public",
          }
        );
      }

      // Update service with image URL
      const service = await storage.updateService(req.params.id, req.salon!.id, { imageUrl: objectPath });
      if (!service) {
        return res.status(404).json({ error: "Service not found or access denied" });
      }

      res.json({ objectPath, service });
    } catch (error) {
      console.error("Error setting service image:", error);
      res.status(500).json({ error: "Failed to set service image" });
    }
  });

  // Save stylist image URL after upload
  app.put("/api/admin/stylists/:id/image", isAuthenticated, requireSalonMembership, requireRole("owner", "admin"), async (req, res) => {
    try {
      if (!req.body.imageUrl) {
        return res.status(400).json({ error: "imageUrl is required" });
      }

      const userId = req.user?.id;
      let objectPath = req.body.imageUrl;
      
      // Set ACL policy for the uploaded image (public visibility for stylist images)
      if (userId) {
        objectPath = await supabaseStorage.trySetObjectEntityAclPolicy(
          req.body.imageUrl,
          {
            owner: userId,
            visibility: "public",
          }
        );
      }

      // Update stylist with image URL
      const stylist = await storage.updateStylist(req.params.id, req.salon!.id, { imageUrl: objectPath });
      if (!stylist) {
        return res.status(404).json({ error: "Stylist not found or access denied" });
      }

      res.json({ objectPath, stylist });
    } catch (error) {
      console.error("Error setting stylist image:", error);
      res.status(500).json({ error: "Failed to set stylist image" });
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

  // Invite a new user with email confirmation
  app.post("/api/superadmin/users/invite", isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { email, role, salonId, redirectTo = "/admin" } = req.body;

      if (!email || !role || !salonId) {
        return res.status(400).json({ error: "Email, role, and salonId are required" });
      }

      // Validate role
      if (!["owner", "admin", "employee"].includes(role)) {
        return res.status(400).json({ error: "Invalid role. Must be owner, admin, or employee" });
      }

      // Get the app URL from environment or construct from request
      const appUrl = process.env.APP_URL || 
                     (process.env.NODE_ENV === 'production' 
                       ? `https://${req.get('host')}` 
                       : `${req.protocol}://${req.get('host')}`);

      // Construct the redirect URL for email confirmation
      const confirmationRedirectUrl = `${appUrl}/api/callback?returnTo=${encodeURIComponent(redirectTo)}`;

      // Invite user via Supabase Admin API
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        email,
        {
          redirectTo: confirmationRedirectUrl,
          data: {
            role,
            salonId,
          }
        }
      );

      if (inviteError) {
        console.error("Error inviting user:", inviteError);
        return res.status(400).json({ error: inviteError.message || "Failed to invite user" });
      }

      if (!inviteData.user) {
        return res.status(500).json({ error: "User invitation failed - no user returned" });
      }

      // Link user to salon immediately (they'll be able to access after confirming email)
      try {
        const validatedSalonUser = insertSalonUserSchema.parse({
          userId: inviteData.user.id,
          salonId,
          role,
        });
        await storage.createSalonUser(validatedSalonUser);
      } catch (linkError) {
        console.error("Error linking user to salon:", linkError);
        // Don't fail the invitation if linking fails - can be done manually later
        // But log it for admin to fix
      }

      res.json({
        success: true,
        user: {
          id: inviteData.user.id,
          email: inviteData.user.email,
          role,
          salonId,
        },
        message: "Invitation email sent successfully",
      });
    } catch (error) {
      console.error("Error inviting user:", error);
      res.status(500).json({ error: "Failed to invite user" });
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

  // Get all salon inquiries
  app.get("/api/superadmin/inquiries", isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const inquiries = await storage.getAllSalonInquiries();
      res.json(inquiries);
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      res.status(500).json({ error: "Failed to fetch inquiries" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
