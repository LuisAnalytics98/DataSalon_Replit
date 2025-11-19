// Vercel serverless function wrapper for Express app
// This file is created at build time from server/index.ts
import { registerRoutes } from '../dist/index.js';

let app;
let server;

export default async function handler(req, res) {
  // Initialize app on first request
  if (!app) {
    const express = (await import('express')).default;
    app = express();
    server = await registerRoutes(app);
  }

  // Handle the request
  return new Promise((resolve, reject) => {
    app(req, res, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

