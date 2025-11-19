// Vercel serverless function entry point
// This wraps the Express app for Vercel deployment
import express, { type Request, Response } from 'express';
import { registerRoutes } from '../server/routes';
import { serveStatic } from '../server/vite';

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

  // Register routes (this sets up auth, routes, etc.)
  // Note: registerRoutes returns a Server, but we don't need it for Vercel
  await registerRoutes(app);

  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: any) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  // Serve static files in production
  serveStatic(app);

  appInstance = app;
  
  return app;
}

// Vercel serverless function handler
export default async function handler(req: Request, res: Response) {
  const app = await getApp();
  
  // Handle the request through Express
  return new Promise<void>((resolve, reject) => {
    app(req, res, (err: any) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
