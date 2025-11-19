// Supabase PostgreSQL connection using postgres client
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import postgres from "postgres";
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from "@shared/schema";

// Load .env.local file FIRST (before checking DATABASE_URL)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, "..", ".env.local") });

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create postgres client for Supabase
// Supabase uses standard PostgreSQL, so we use postgres-js instead of Neon's WebSocket driver
const client = postgres(process.env.DATABASE_URL, {
  max: 10, // Maximum number of connections
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
