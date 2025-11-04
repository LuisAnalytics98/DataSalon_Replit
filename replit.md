# Salon Booking Application

## Overview

This is a premium salon booking application that allows clients to book appointments with stylists for various salon services. The application features a multi-step booking flow with service selection, stylist selection, date/time scheduling, and client information collection. It emphasizes a luxurious dark theme with gold accents, inspired by high-end salon experiences.

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
- RESTful endpoints following resource-based URL patterns
- `/api/services` - GET all available salon services
- `/api/stylists` - GET all available stylists
- `/api/bookings` - POST to create new bookings

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
- `clients` - Customer information (name, email, phone, notes)
- `services` - Salon services with pricing and duration
- `stylists` - Staff profiles with specialties and ratings
- `bookings` - Appointment records linking clients, services, and stylists with date/time

**Seeding Strategy:**
- Automatic database seeding on server startup for services and stylists
- Idempotent seed operations to prevent duplicate data

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

**Session Management:**
- connect-pg-simple - PostgreSQL session store for Express sessions (configured but session usage not implemented in current routes)

**Fonts:**
- Google Fonts API - Playfair Display and Inter font families loaded via CDN