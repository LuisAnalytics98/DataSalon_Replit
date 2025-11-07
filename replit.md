# Salon Booking Application

## Overview

This is a premium, multi-tenant salon booking application designed for the Spanish-speaking market. It enables individual salons to manage appointments with complete data isolation. The platform supports a public booking flow for clients (no authentication) and protected admin/employee panels accessible via Replit Auth. The application features a luxurious dark theme with gold accents, Playfair Display headings, and Inter body text, aiming for a high-end user experience. Key capabilities include multi-currency pricing, image uploads for services and stylists, real-time booking conflict prevention, and a comprehensive analytics dashboard for salon administrators. The project's ambition is to provide a robust, scalable solution for salons, enhancing their operational efficiency and client engagement.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with React 18 and TypeScript, using Vite for a fast development experience. UI components leverage Shadcn/ui (New York style) built on Radix UI primitives, styled with Tailwind CSS for a utility-first approach. A premium dark luxury theme with gold accents, Playfair Display for headings, and Inter for body text defines the aesthetic. State management is handled by TanStack Query for server state and React Hook Form with Zod for form management. Wouter is used for client-side routing. The branding features a "Data Salon" logo with a golden armchair icon.

The booking flow follows a multi-step wizard: client info (including name, email, phone, and birth date with enhanced calendar picker), service selection, professional selection, date/time selection, and final confirmation. The employee panel, accessible at `/employee`, offers a dynamic calendar view (react-big-calendar) for appointment management, with filtering, multiple view options, and Spanish localization, color-coded by status.

**Note:** The application uses "Profesional" (Professional) terminology instead of "Estilista" (Stylist) throughout the UI for a more premium feel.

### Backend Architecture

The backend is an Express.js REST API with TypeScript. It features a multi-tenant architecture with distinct public and protected (Replit Auth required) routes. Public routes handle service/stylist listings and booking creation, while admin routes manage CRUD operations for services, stylists, bookings, and user management. Security measures include salon ownership verification, role-based access control, and generic error messages to prevent information leakage. Data validation is performed using Zod schemas, shared between client and server for type consistency.

### Data Storage Solutions

PostgreSQL is the primary relational database, utilizing Neon serverless PostgreSQL for cloud hosting and `@neondatabase/serverless` for connection pooling. Drizzle ORM provides type-safe queries and migrations, with a schema-first approach and Zod integration.

Core data models include `salons` (multi-tenancy), `users`, and `salon_users` (for roles). Salon-scoped data includes `clients`, `services` (with `currency` and `imageUrl`), `stylists` (with `userId` and `imageUrl`), `stylist_availability`, and `bookings` (with `finalPrice`). A demo salon is seeded on server startup.

### System Design Choices

- **Multi-Tenancy:** Each salon has isolated data and a unique booking URL (`/book/:salonSlug`). Super-admin panel allows platform owner to manage salons.
- **Authentication:** Replit Auth (OIDC) secures admin/employee panels, with a `salon_users` whitelist. Public booking requires no authentication.
- **Image Uploads:** Integrated Replit Object Storage for service and stylist images via dedicated API endpoints and an `ObjectUploader` component.
- **Booking Conflict Prevention:** Real-time availability checks prevent double-booking. When clients select a date/time, the system fetches all existing bookings for that professional and date, visually disabling already-booked time slots (greyed out with strikethrough). Race condition safeguards automatically clear selections if a slot becomes booked and validate availability before submission. Backend returns 409 Conflict for double-booking attempts.
- **Service Duration System:** Services have numeric durations (30, 60, 90, 120 minutes) shown with "min" suffix. Time slots are blocked for the full service duration to prevent overlapping bookings.
- **Reservation Amount System:** Services can require a reservation deposit (`reservationAmount` field). When booking a service with a reservation amount, clients see a warning card with AlertTriangle icon and WhatsApp payment instructions in Spanish: "Por favor enviar el comprobante al WhatsApp del salón con el monto de reserva, de otro modo se cancelará tu cita."
- **Admin Calendar:** Comprehensive calendar view (via `/admin` → "Calendario" tab) with employee/stylist filtering, inline editing of booking status and final price, and support for creating appointments directly from agenda view. Uses react-big-calendar with Spanish localization.
- **Analytics Dashboard:** Comprehensive admin dashboard (accessed via `/admin` → "Análisis" tab) with **employee/stylist filtering** displays key metrics, popular services, top professionals, **top clients by revenue**, revenue breakdown, and status distribution. Client analytics show booking counts, email addresses, and total revenue generated. All metrics can be filtered by specific professional.
- **Salon Contact Management:** Admin can configure salon contact information (phone, email, location, social media links) via Settings tab. This information is displayed at the bottom of the public booking page for client reference.
- **Employee Permissions:** Employee dashboard (`/employee`) restricts data access to only bookings assigned to the logged-in employee's linked stylist record. Backend enforces this via `getStylistByUserId` method, ensuring employees cannot view other professionals' appointments. The employee panel removed stylist filtering (since employees only see their own bookings) but retains calendar view options.
- **Service Completion Workflow:** Employee panel allows updating booking status and `finalPrice`.
- **Stylist-to-User Linking:** Allows linking stylist profiles to user accounts for system access.
- **Marketing Landing Page:** Root path `/` features a marketing page with an inquiry form for salon owners.
- **Professional Filtering:** Stylist selection automatically filters professionals by service specialties, with fallback to show all professionals if no specialty match is found.
- **Email Confirmation System:** Automated email confirmations sent to both client and salon admin upon booking creation. Emails contain booking details, salon contact information, and secure confirm/cancel action links. Uses Resend API for reliable transactional email delivery. Confirmation tokens are cryptographically secure (32-byte hex), expire after 48 hours, and are single-use. Public endpoints `/api/bookings/:id/confirm` and `/api/bookings/:id/cancel` handle token validation and return branded HTML success/error pages in Spanish.

## External Dependencies

- **UI Component Libraries:** Radix UI, Shadcn/ui, Lucide React
- **Form Management:** React Hook Form, @hookform/resolvers (for Zod)
- **Styling:** Tailwind CSS, PostCSS, class-variance-authority, clsx, tailwind-merge
- **Date Handling:** date-fns, react-big-calendar
- **Database & ORM:** Drizzle ORM, Drizzle Kit, @neondatabase/serverless, ws
- **Authentication & Session:** Replit Auth (OIDC), openid-client, express-session, connect-pg-simple, Passport.js
- **Object Storage:** @google-cloud/storage (for Replit Object Storage), Uppy Core, Uppy AWS S3 plugin
- **Email Service:** Resend API for transactional emails
- **Fonts:** Google Fonts API (Playfair Display, Inter)