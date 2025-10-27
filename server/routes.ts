import type { Express } from "express";
import { createServer, type Server } from "http";
import farcasterRoutes from "./farcaster-routes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Farcaster miniapp routes
  app.use('/api/farcaster', farcasterRoutes);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'farcaster-miniapp' });
  });

  const httpServer = createServer(app);
  return httpServer;
}
