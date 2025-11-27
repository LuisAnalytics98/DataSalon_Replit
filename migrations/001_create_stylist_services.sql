-- Migration: Create stylist_services junction table
-- This table establishes a many-to-many relationship between stylists and services
-- Created: 2025-01-XX

CREATE TABLE IF NOT EXISTS stylist_services (
  id SERIAL PRIMARY KEY,
  stylist_id VARCHAR NOT NULL REFERENCES stylists(id) ON DELETE CASCADE,
  service_id VARCHAR NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(stylist_id, service_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_stylist_services_stylist_id ON stylist_services(stylist_id);
CREATE INDEX IF NOT EXISTS idx_stylist_services_service_id ON stylist_services(service_id);

-- Add comment to table
COMMENT ON TABLE stylist_services IS 'Junction table for many-to-many relationship between stylists and services. Each row represents that a stylist offers a specific service.';

