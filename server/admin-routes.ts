/**
 * Admin API Routes for Agent Management
 * Deploy, manage, and monitor decentralized agents
 */

import type { Express } from "express";
import { z } from "zod";
import { deployVirtualsAgent, getAgentDetails } from "../lib/agents/virtuals-agent";
import { db } from "./db";
import { agents } from "../shared/schema";
import { eq } from "drizzle-orm";

// Schema for agent deployment
const deployAgentSchema = z.object({
  handle: z.string().regex(/^@[a-z0-9_]+$/, 'Handle must start with @ and contain only lowercase letters, numbers, and underscores'),
  name: z.string().min(1).max(100),
  description: z.string().min(10).max(500),
  personality: z.string().min(10).max(500),
  method: z.string().min(5).max(200),
  aggressiveness: z.number().min(0.5).max(1.5).default(1.0),
  adminKey: z.string(), // Admin authentication
});

/**
 * Setup admin routes
 */
export function setupAdminRoutes(app: Express) {
  
  /**
   * POST /api/admin/agents/deploy
   * Deploy a new agent to Base Sepolia
   */
  app.post("/api/admin/agents/deploy", async (req, res) => {
    try {
      const data = deployAgentSchema.parse(req.body);

      // Verify admin key
      if (data.adminKey !== process.env.ADMIN_KEY) {
        return res.status(403).json({ error: "Invalid admin key" });
      }

      console.log(`🚀 Admin deploying new agent: ${data.handle}`);

      // Check if handle already exists
      const existing = await db
        .select()
        .from(agents)
        .where(eq(agents.handle, data.handle))
        .limit(1);

      if (existing.length > 0) {
        return res.status(400).json({ 
          error: "Agent handle already exists",
          agent: existing[0],
        });
      }

      // Deploy agent to Base Sepolia
      const deployed = await deployVirtualsAgent({
        handle: data.handle,
        name: data.name,
        description: data.description,
        personality: data.personality,
        method: data.method,
        aggressiveness: data.aggressiveness,
      });

      // Store in database
      const [agent] = await db.insert(agents).values({
        handle: data.handle,
        method: data.method,
        description: data.description,
        personality: data.personality,
        aggressiveness: data.aggressiveness,
        reputation: 0,
        isActive: true,
        contractAddress: deployed.contractAddress,
        deploymentTx: deployed.deploymentTx,
        chainId: deployed.chainId,
      }).returning();

      res.json({
        success: true,
        agent,
        deployment: {
          contractAddress: deployed.contractAddress,
          txHash: deployed.deploymentTx,
          explorer: `https://sepolia-explorer.base.org/tx/${deployed.deploymentTx}`,
          gasSponsor: "Platform",
        },
      });

    } catch (error: any) {
      console.error("Agent deployment error:", error);
      res.status(500).json({ 
        error: "Agent deployment failed",
        details: error.message,
      });
    }
  });

  /**
   * GET /api/admin/agents/:id/on-chain
   * Get on-chain details for an agent
   */
  app.get("/api/admin/agents/:id/on-chain", async (req, res) => {
    try {
      const agentId = req.params.id;

      const [agent] = await db
        .select()
        .from(agents)
        .where(eq(agents.id, agentId))
        .limit(1);

      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }

      if (!agent.contractAddress) {
        return res.status(400).json({ 
          error: "Agent not deployed on-chain yet",
          agent,
        });
      }

      // Fetch on-chain data
      const onChainDetails = await getAgentDetails(agent.contractAddress);

      res.json({
        agent,
        onChain: onChainDetails,
        explorer: `https://sepolia-explorer.base.org/address/${agent.contractAddress}`,
      });

    } catch (error: any) {
      console.error("Error fetching on-chain details:", error);
      res.status(500).json({ 
        error: "Failed to fetch on-chain data",
        details: error.message,
      });
    }
  });

  /**
   * POST /api/admin/agents/:id/toggle
   * Enable/disable an agent
   */
  app.post("/api/admin/agents/:id/toggle", async (req, res) => {
    try {
      const { adminKey } = req.body;

      if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(403).json({ error: "Invalid admin key" });
      }

      const agentId = req.params.id;

      const [agent] = await db
        .select()
        .from(agents)
        .where(eq(agents.id, agentId))
        .limit(1);

      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }

      // Toggle active status
      const [updated] = await db
        .update(agents)
        .set({ isActive: !agent.isActive })
        .where(eq(agents.id, agentId))
        .returning();

      res.json({
        success: true,
        agent: updated,
        message: `Agent ${updated.isActive ? 'activated' : 'deactivated'}`,
      });

    } catch (error: any) {
      console.error("Error toggling agent:", error);
      res.status(500).json({ 
        error: "Failed to toggle agent",
        details: error.message,
      });
    }
  });

  /**
   * GET /api/admin/stats
   * Get platform statistics
   */
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const adminKey = req.query.adminKey as string;

      if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(403).json({ error: "Invalid admin key" });
      }

      const allAgents = await db.select().from(agents);

      const stats = {
        totalAgents: allAgents.length,
        activeAgents: allAgents.filter(a => a.isActive).length,
        onChainAgents: allAgents.filter(a => a.contractAddress).length,
        totalReputation: allAgents.reduce((sum, a) => sum + (a.reputation || 0), 0),
        agents: allAgents.map(a => ({
          id: a.id,
          handle: a.handle,
          reputation: a.reputation,
          isActive: a.isActive,
          contractAddress: a.contractAddress,
          chainId: a.chainId,
        })),
      };

      res.json(stats);

    } catch (error: any) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ 
        error: "Failed to fetch stats",
        details: error.message,
      });
    }
  });

  console.log("✅ Admin routes configured");
  console.log("   POST /api/admin/agents/deploy - Deploy new agent");
  console.log("   GET  /api/admin/agents/:id/on-chain - Get on-chain details");
  console.log("   POST /api/admin/agents/:id/toggle - Enable/disable agent");
  console.log("   GET  /api/admin/stats - Platform stats");
}

