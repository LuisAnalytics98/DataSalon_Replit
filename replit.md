# Salon Booking Application

## Overview

This is a Spanish-language premium multi-tenant salon booking application that allows each salon to manage their appointments independently with complete data isolation. Clients can book appointments through a public booking flow (no authentication required) while salon staff access protected admin/employee panels via Replit Auth. The application features a luxurious dark theme (#1a1a1a background) with gold accents (#D4AF37), Playfair Display headings, and Inter body text.

**Multi-Tenancy:**
- Each salon has isolated data (services, stylists, bookings)
- Unique booking URLs per salon: `/book/:salonSlug`
- Role-based access control with salon membership verification
- Cross-tenant data protection at database and API levels

**Authentication:**
- Public booking flow: No authentication required
- Admin/Employee panels: Protected by Replit Auth (OIDC)
- Whitelist mechanism via `salon_users` table
- Session-based authentication with PostgreSQL session store

## Recent Changes

**November 4, 2025 - Multi-Currency Pricing:**
- Added `currency` field to services table (supports "dolares" and "colones")
- Admin panel now includes currency selector dropdown when creating/editing services
- Updated all price displays to show "Precio aproximado" instead of just price
- Currency symbols dynamically display: $ for dollars, ₡ for colones
- Updated components: ServicesManagement, ServiceSelection, BookingConfirmation
- End-to-end tested: currency selection in admin, price display with symbols on booking pages

**November 4, 2025 - Image Upload and Booking Conflict Prevention:**
- Integrated Replit Object Storage for service and stylist images
- Added `imageUrl` field to `services` and `stylists` tables
- Created `ObjectUploader` component with file selection, progress tracking, and upload functionality
- Admin panels now include "Upload Image" buttons for services and stylists
- Created upload endpoints: `POST /api/admin/services/:id/image` and `POST /api/admin/stylists/:id/image`
- Booking pages display uploaded images with fallback to placeholder icons (ImageIcon/User)
- Implemented time slot conflict prevention: booking creation validates availability and returns 409 Conflict if slot already booked
- Availability endpoint excludes booked time slots (cancelled bookings not counted as conflicts)
- End-to-end tested: upload UI verified in admin panel, image display confirmed in booking flow

**November 4, 2025 - Booking Flow Update:**
- Removed "Cualquier Estilista Disponible" option from stylist selection page
- Clients must now select a specific stylist to proceed with booking
- Updated subtitle to "Selecciona tu estilista preferido"

**November 4, 2025 - Stylist-to-User Linking Feature:**
- Added `userId` field to `stylists` table (nullable foreign key to `users.id`)
- Created `GET /api/admin/users` endpoint to fetch salon users for dropdown selection
- Updated StylistsManagement component with user selection dropdown in create/edit forms
- Added "Acceso al sistema" badge to stylist cards when linked to a user account
- Enables salon admins to link stylist profiles (service providers) to user accounts (system access)
- End-to-end tested: create stylist with user link, edit to remove link, verify badge behavior

**November 4, 2025 - Dynamic Salon Routing Implementation:**
- Added `/book/:salonSlug` route for unique salon booking URLs
- Home component now reads salon slug from URL parameters with fallback to "demo-salon"
- Implemented state reset on salon switch to prevent cross-salon data corruption
- Root path `/` defaults to demo-salon for backwards compatibility
- Tested with multiple salons (demo-salon, nail-station)
- Super-admin panel allows platform owner to create and manage salons via `/superadmin`
- Super-admin authentication controlled by `SUPER_ADMIN_EMAIL` environment variable

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server for fast hot module replacement
- Wouter for lightweight client-side routing (instead of React Router)

**UI Component Strategy:**
- Shadcn/ui component library (New York style variant) for consistent, accessible UI components
- Radix UI primitives as the foundation for interactive components (dialogs, dropdowns, tooltips, etc.)
- Tailwind CSS for utility-first styling with custom design tokens

**Design System:**
- Premium dark luxury theme (#1a1a1a background) with warm gold accents (#D4AF37)
- Typography: Playfair Display for headings (elegant serif), Inter for body text
- Custom CSS variables for theming with support for elevation states (hover, active)
- Responsive design with mobile-first approach

**State Management:**
- TanStack Query (React Query) for server state management and caching
- React Hook Form with Zod validation for form state and validation
- Local component state using React hooks for UI-specific state

**Branding:**
- Header component displaying "Data Salon" logo across all pages
- Golden armchair icon representing the luxury salon brand
- Persistent header maintains brand identity throughout booking flow

**Booking Flow:**
Multi-step wizard pattern with five distinct steps:
1. Client information collection
2. Service selection (haircut, manicure, pedicure)
3. Stylist selection (with option for "any available")
4. Date and time selection with calendar interface
5. Booking confirmation with reference number

**Employee Panel:**
- Accessible at `/employee` route (not linked in main navigation)
- Dynamic calendar view for tracking appointments using react-big-calendar
- Filter appointments by individual stylist or view all stylists
- Multiple calendar view options: Month, Week, Day, and Agenda
- Spanish localization for all calendar labels and controls
- Color-coded appointments by status (pending, for today, in progress, done, cancelled)
- Displays service name and client name on each calendar event

### Backend Architecture

**Server Framework:**
- Express.js REST API with TypeScript
- Custom middleware for request logging and JSON parsing
- HTTP server creation using Node's built-in `http` module

**API Design:**
Multi-tenant API architecture with clear separation between public and protected routes:

*Public Routes (no authentication):*
- `GET /api/public/:salonSlug/services` - List salon services
- `GET /api/public/:salonSlug/stylists` - List salon stylists
- `GET /api/public/stylists/:id/availability` - Get stylist availability
- `POST /api/public/:salonSlug/bookings` - Create booking (public)

*Admin Routes (Replit Auth required):*
- `GET /api/admin/services` - List salon services (scoped to user's salon)
- `POST /api/admin/services` - Create service
- `PATCH /api/admin/services/:id` - Update service
- `DELETE /api/admin/services/:id` - Delete service
- `POST /api/admin/services/:id/image` - Upload image for service
- `GET /api/admin/stylists` - List salon stylists (scoped to user's salon)
- `POST /api/admin/stylists` - Create stylist
- `PATCH /api/admin/stylists/:id` - Update stylist
- `DELETE /api/admin/stylists/:id` - Delete stylist
- `POST /api/admin/stylists/:id/image` - Upload image for stylist
- `POST /api/admin/stylists/:id/availability` - Update stylist availability
- `GET /api/admin/users` - List users assigned to salon (for stylist-user linking)
- `GET /api/admin/bookings` - List bookings (scoped to user's salon)
- `PATCH /api/admin/bookings/:id/status` - Update booking status

*Authentication Routes:*
- `GET /auth/login` - Initiate Replit Auth login
- `GET /auth/callback` - Handle OAuth callback
- `GET /auth/user` - Get current user info
- `POST /auth/logout` - End session

**Security Measures:**
- All admin mutations verify salon ownership using `and(eq(id), eq(salonId))`
- Middleware enforces salon context resolution from slug
- Role-based access control checks salon membership
- Error messages use "not found or access denied" to prevent information leakage

**Data Validation:**
- Zod schemas for runtime validation of incoming requests
- Shared schema definitions between client and server for type consistency
- Input sanitization through schema parsing before database operations

**Development Setup:**
- Vite middleware integration for development with HMR
- Static file serving for production builds
- Custom error overlay plugin for runtime errors in development

### Data Storage Solutions

**Database:**
- PostgreSQL as the primary relational database
- Neon serverless PostgreSQL for cloud hosting with WebSocket support
- Connection pooling using `@neondatabase/serverless` Pool

**ORM & Schema Management:**
- Drizzle ORM for type-safe database queries and migrations
- Schema-first approach with TypeScript-based table definitions
- Zod integration for automatic schema validation from database models

**Data Models:**

*Multi-Tenancy Core:*
- `salons` - Salon accounts with unique slug, name, and settings
- `users` - User accounts (linked to Replit Auth sub)
- `salon_users` - Junction table for salon membership and roles (admin, employee)

*Salon-Scoped Data:*
- `clients` - Customer information (name, email, phone, notes) - scoped to salon
- `services` - Salon services with pricing and duration - scoped to salon via `salonId`
  - Includes `currency` field to specify pricing currency ("dolares" or "colones")
  - Includes optional `imageUrl` field for uploaded service images
- `stylists` - Staff profiles with specialties and ratings - scoped to salon via `salonId`
  - Includes optional `userId` field to link stylist profiles to user accounts for system access
  - Includes optional `imageUrl` field for uploaded stylist profile photos
- `stylist_availability` - Weekly schedules - linked to stylists
- `bookings` - Appointment records - scoped to salon via `salonId`

**Seeding Strategy:**
- Demo salon ("demo-salon" slug) seeded on server startup
- Includes 3 services (Corte de Cabello, Manicura, Pedicura)
- Includes 3 stylists (María González, Carlos Rodríguez, Ana Martínez)
- Idempotent seed operations prevent duplicate data

### External Dependencies

**UI Component Libraries:**
- Radix UI - Comprehensive set of accessible, unstyled component primitives
- Shadcn/ui - Pre-styled component implementations built on Radix
- Lucide React - Icon library for consistent iconography

**Form Management:**
- React Hook Form - Performant form state management with minimal re-renders
- @hookform/resolvers - Integration layer for Zod validation schemas

**Styling:**
- Tailwind CSS - Utility-first CSS framework
- PostCSS with Autoprefixer - CSS processing and vendor prefixing
- class-variance-authority - Type-safe variant styling for components
- clsx & tailwind-merge - Utility for conditional class composition

**Date Handling:**
- date-fns - Modern date utility library for formatting and manipulation
- react-big-calendar - Google Calendar-style event calendar with multiple view options (month, week, day, agenda)

**Database & ORM:**
- Drizzle ORM - Lightweight TypeScript ORM
- Drizzle Kit - CLI for schema migrations and database management
- @neondatabase/serverless - Neon's PostgreSQL driver with WebSocket support
- ws - WebSocket client for Neon database connections

**Development Tools:**
- TypeScript - Static type checking
- ESBuild - Fast JavaScript bundler for production builds
- TSX - TypeScript execution engine for development
- Replit-specific plugins for enhanced development experience (cartographer, dev banner, runtime error modal)

**Authentication & Session Management:**
- Replit Auth (OIDC) - Primary authentication provider
- openid-client - OIDC client library for Replit Auth integration
- express-session - Session middleware with PostgreSQL persistence
- connect-pg-simple - PostgreSQL session store for secure session management
- Passport.js - Authentication middleware (configured for future extensibility)

**Object Storage:**
- @google-cloud/storage - Google Cloud Storage client for Replit Object Storage integration
- Uppy Core & AWS S3 plugin - File upload library with progress tracking and S3-compatible uploads
- Custom ObjectUploader component - React component providing file selection, upload progress, and completion handling
- Replit Object Storage integration provides secure cloud storage for service and stylist images

**Fonts:**
- Google Fonts API - Playfair Display and Inter font families loaded via CDN