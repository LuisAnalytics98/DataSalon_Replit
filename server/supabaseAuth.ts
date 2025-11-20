import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createClient } from '@supabase/supabase-js';
import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage.js";

// Load .env.local file FIRST
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, "..", ".env.local") });

// Extend session type to include returnTo
declare module 'express-session' {
  interface SessionData {
    returnTo?: string;
    supabaseAccessToken?: string;
    supabaseRefreshToken?: string;
  }
}

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
}

// Server-side Supabase client with service role key (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Client-side Supabase client (for public operations)
export const supabasePublic = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  // Use a default secret if not provided (for development/testing only)
  // In production, this should be set via environment variable
  const sessionSecret = process.env.SESSION_SECRET || 'default-secret-change-in-production';
  
  if (!process.env.SESSION_SECRET) {
    console.warn('[AUTH] WARNING: SESSION_SECRET not set, using default secret. This is insecure for production!');
  }
  
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Try to use PostgreSQL session store, fallback to memory store if DB connection fails
  let sessionStore: any;
  
  if (process.env.DATABASE_URL) {
    try {
      const pgStore = connectPg(session);
      // Wrap in try-catch to handle any synchronous errors during initialization
      try {
        sessionStore = new pgStore({
          conString: process.env.DATABASE_URL,
          createTableIfMissing: true, // Create table if missing to avoid errors
          ttl: sessionTtl,
          tableName: "sessions",
        });
        console.log('[AUTH] Using PostgreSQL session store');
      } catch (storeError: any) {
        console.warn('[AUTH] Failed to create PostgreSQL session store instance, using memory store:', storeError?.message || storeError);
        sessionStore = undefined;
      }
    } catch (error: any) {
      console.warn('[AUTH] Failed to initialize PostgreSQL session store, using memory store:', error?.message || error);
      // Fall back to memory store if PostgreSQL fails
      sessionStore = undefined;
    }
  } else {
    console.warn('[AUTH] DATABASE_URL not set, using memory store for sessions');
  }
  
  try {
    return session({
      secret: sessionSecret,
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: isProduction, // Only require HTTPS in production
        sameSite: 'lax',
        maxAge: sessionTtl,
      },
    });
  } catch (error: any) {
    console.error('[AUTH] Failed to create session middleware:', error?.message || error);
    // Return a minimal session config as fallback
    return session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: sessionTtl,
      },
    });
  }
}

async function upsertUser(userId: string, email: string, metadata?: {
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}) {
  // Upsert user in our custom users table
  await storage.upsertUser({
    id: userId,
    email,
    firstName: metadata?.firstName,
    lastName: metadata?.lastName,
    profileImageUrl: metadata?.profileImageUrl,
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  
  try {
    const sessionMiddleware = getSession();
    app.use(sessionMiddleware);
    console.log('[AUTH] Session middleware configured successfully');
  } catch (error: any) {
    console.error('[AUTH] Failed to setup session middleware:', error?.message || error);
    // Don't throw - try to continue without session (though this may cause issues)
    // In production, this should be caught and handled properly
    console.error('[AUTH] Continuing without session middleware - this may cause authentication issues');
  }

  // Login endpoint - serves login page or handles login POST
  app.get("/api/login", (req, res, next) => {
    try {
      // Save returnTo parameter to session for post-login redirect
      if (req.query.returnTo && typeof req.query.returnTo === 'string') {
        try {
          req.session.returnTo = req.query.returnTo as string;
        } catch (sessionError) {
          // If session save fails, we'll use URL param instead
          console.warn('[AUTH] Failed to save returnTo to session, will use URL param:', sessionError);
        }
      }

      // Redirect to client-side login page
      // Preserve returnTo in URL if session save failed or as backup
      const returnTo = req.query.returnTo ? `?returnTo=${encodeURIComponent(req.query.returnTo as string)}` : '';
      const loginUrl = `/login${returnTo}`;
      res.redirect(loginUrl);
    } catch (error) {
      console.error('[AUTH] Error in login GET handler:', error);
      // If redirect fails, try to send a JSON response instead
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to process login request" });
      } else {
        next(error);
      }
    }
  });

  // Handle login POST (email/password)
  app.post("/api/login", async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      // Use Supabase Admin API to sign in user
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.session) {
        return res.status(401).json({ error: error?.message || "Invalid credentials" });
      }

      const { user, access_token, refresh_token } = data.session;

      // Store tokens in session
      req.session.supabaseAccessToken = access_token;
      req.session.supabaseRefreshToken = refresh_token;

      // Upsert user in our database
      await upsertUser(
        user.id,
        user.email!,
        {
          firstName: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0],
          lastName: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' '),
          profileImageUrl: user.user_metadata?.avatar_url || user.user_metadata?.profile_image_url,
        }
      );

      // Redirect to saved returnTo or home
      const returnTo = req.session.returnTo || "/";
      delete req.session.returnTo;
      
      res.json({ success: true, redirectTo: returnTo });
    } catch (error) {
      console.error('[AUTH] Login error:', error);
      next(error);
    }
  });

  // Callback endpoint - handles Supabase Auth callback
  app.get("/api/callback", async (req, res, next) => {
    try {
      const code = req.query.code as string;
      
      if (!code) {
        return res.redirect("/api/login");
      }

      // Exchange code for session
      const redirectTo = `${req.protocol}://${req.get('host')}/api/callback`;
      const { data, error } = await supabasePublic.auth.exchangeCodeForSession(code);

      if (error || !data.session) {
        console.error('[AUTH] Error exchanging code:', error);
        return res.redirect("/api/login");
      }

      const { user, access_token, refresh_token } = data.session;

      // Store tokens in session
      req.session.supabaseAccessToken = access_token;
      req.session.supabaseRefreshToken = refresh_token;

      // Upsert user in our database
      await upsertUser(
        user.id,
        user.email!,
        {
          firstName: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0],
          lastName: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' '),
          profileImageUrl: user.user_metadata?.avatar_url || user.user_metadata?.profile_image_url,
        }
      );

      // Redirect to saved returnTo or home
      const returnTo = req.session.returnTo || "/";
      delete req.session.returnTo;
      
      res.redirect(returnTo);
    } catch (error) {
      console.error('[AUTH] Callback error:', error);
      next(error);
    }
  });

  // Logout endpoint
  app.get("/api/logout", async (req, res) => {
    const accessToken = req.session.supabaseAccessToken;
    
    if (accessToken) {
      // Sign out from Supabase
      await supabaseAdmin.auth.admin.signOut(accessToken);
    }

    req.session.destroy((err) => {
      if (err) {
        console.error('[AUTH] Error destroying session:', err);
      }
      res.redirect("/");
    });
  });

  // Get current user endpoint (for client-side)
  app.get("/api/user", async (req, res) => {
    const accessToken = req.session.supabaseAccessToken;
    
    if (!accessToken) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
      
      if (error || !user) {
        return res.status(401).json({ error: "Invalid session" });
      }

      // Get user from our database
      const dbUser = await storage.getUser(user.id);
      
      res.json({
        id: user.id,
        email: user.email,
        firstName: dbUser?.firstName,
        lastName: dbUser?.lastName,
        profileImageUrl: dbUser?.profileImageUrl,
      });
    } catch (error) {
      console.error('[AUTH] Error getting user:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}

// Middleware to check authentication
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const accessToken = req.session.supabaseAccessToken;

  if (!accessToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Verify token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);

    if (error || !user) {
      // Try to refresh token
      const refreshToken = req.session.supabaseRefreshToken;
      if (refreshToken) {
        const { data: refreshData, error: refreshError } = await supabasePublic.auth.refreshSession({
          refresh_token: refreshToken
        });

        if (!refreshError && refreshData.session) {
          req.session.supabaseAccessToken = refreshData.session.access_token;
          req.session.supabaseRefreshToken = refreshData.session.refresh_token;
          return next();
        }
      }

      return res.status(401).json({ message: "Unauthorized" });
    }

    // Attach user to request
    (req as any).user = {
      id: user.id,
      email: user.email,
      access_token: accessToken,
    };

    next();
  } catch (error) {
    console.error('[AUTH] Authentication error:', error);
    res.status(401).json({ message: "Unauthorized" });
  }
};

// Helper to get current user from request
export function getCurrentUser(req: any): { id: string; email: string } | null {
  return req.user || null;
}

