// Vercel serverless function entry point
// This wraps the Express app for Vercel deployment
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import express, { type Request, Response } from 'express';
import { registerRoutes } from '../server/routes.js';
import { serveStatic } from '../server/vite.js';

// Load environment variables (Vercel provides these, but we load .env.local for local dev)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, "..", ".env.local") });

// Set NODE_ENV if not already set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = process.env.VERCEL ? "production" : "development";
}

// Create Express app instance (singleton)
let appInstance: express.Express | null = null;

async function getApp(): Promise<express.Express> {
  if (appInstance) {
    return appInstance;
  }

  const app = express();
  
  // Apply middleware
  app.use(express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    }
  }));
  app.use(express.urlencoded({ extended: false }));

  try {
    // Register routes (this sets up auth, routes, etc.)
    // Note: registerRoutes returns a Server, but we don't need it for Vercel
    try {
      await registerRoutes(app);
      console.log('[API] Routes registered successfully');
    } catch (routeError: any) {
      console.error('[API] Error registering routes:', routeError?.message || routeError);
      // Add a basic error route so the app doesn't completely fail
      app.get('*', (_req, res) => {
        res.status(500).json({ 
          error: 'Application initialization failed',
          message: routeError?.message || 'Unknown error'
        });
      });
      throw routeError; // Re-throw to be caught by outer try-catch
    }

    // Handle favicon requests gracefully
    app.get('/favicon.ico', (_req, res) => {
      res.status(204).end(); // No content
    });

    // Error handler
    app.use((err: any, _req: Request, res: Response, _next: any) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error('[API] Error:', err);
      
      // Don't send error response if headers already sent
      if (!res.headersSent) {
        res.status(status).json({ message });
      }
    });

    // Serve static files in production (only if dist/public exists)
    // On Vercel, static files are served separately, but we include this for fallback
    try {
      serveStatic(app);
    } catch (staticError: any) {
      // If static files don't exist, that's okay - Vercel serves them separately
      console.warn('[API] Static files not found, skipping:', staticError.message);
    }

    appInstance = app;
  } catch (error) {
    console.error('[API] Failed to initialize app:', error);
    throw error;
  }
  
  return app;
}

// Vercel serverless function handler
export default async function handler(req: Request, res: Response) {
  try {
    const app = await getApp();
    
    // Handle the request through Express
    return new Promise<void>((resolve, reject) => {
      // Set a timeout to prevent hanging requests
      const timeout = setTimeout(() => {
        if (!res.headersSent) {
          res.status(504).json({ error: "Request timeout" });
          resolve();
        }
      }, 30000); // 30 second timeout

      app(req, res, (err: any) => {
        clearTimeout(timeout);
        if (err) {
          console.error('[API] Request handler error:', err);
          if (!res.headersSent) {
            res.status(500).json({ error: "Internal server error", message: err?.message || "Unknown error" });
          }
          resolve(); // Resolve instead of reject to prevent unhandled promise rejection
        } else {
          resolve();
        }
      });
    });
  } catch (error: any) {
    console.error('[API] Handler initialization error:', error);
    // Always try to send a response, even if initialization failed
    if (!res.headersSent) {
      try {
        res.status(500).json({ 
          error: "Failed to initialize application",
          message: error?.message || "Unknown error",
          stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
        });
      } catch (responseError) {
        console.error('[API] Failed to send error response:', responseError);
      }
    }
    // Don't throw - Vercel will handle the error response we sent
    return;
  }
}
