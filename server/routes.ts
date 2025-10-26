import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupAdminRoutes } from "./admin-routes";
import { createAgentHandler, getAgentCreationStats } from "./agent-creation";
import farcasterRoutes from "./farcaster-routes";
import { DateTime } from "luxon";
import crypto from "crypto";
import { calculatePlanetaryPositions } from "../lib/astro/planets";
import { calculateAscendant } from "../lib/astro/equalHouses";
import { generateAurigaPrediction } from "../lib/agents/agentA";
import { generateNovaPrediction } from "../lib/agents/agentB";
import {
  createChartRequestSchema,
  createChartZKRequestSchema,
  createPredictionRequestSchema,
  selectAnswerSchema,
  type CreateChartRequest,
  type CreateChartZKRequest,
  type CreatePredictionRequest,
  type SelectAnswerRequest,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication first
  await setupAuth(app);

  // Farcaster miniapp routes
  app.use('/api/farcaster', farcasterRoutes);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      // In local dev mode (using Privy), there's no server-side user session
      // Return 401 to indicate not authenticated, frontend will use Privy
      if (!req.user || !req.user.claims) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Wallet authentication endpoint (Web3/MetaMask)
  app.post('/api/auth/wallet', async (req, res) => {
    try {
      const { address, message, signature } = req.body;

      if (!address || !message || !signature) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // For now, we'll trust the signature (in production, verify it using ethers.js)
      // This is a simplified version - proper implementation would verify the signature
      
      // Create or get user by wallet address
      let user = await storage.getUserByEmail(address.toLowerCase());
      
      if (!user) {
        // Create new user with wallet address
        user = await storage.createUser({
          email: address.toLowerCase(),
          firstName: "Wallet",
          lastName: "User",
          profileImageUrl: null,
        });
      }

      // Create session (simplified - in production use proper session management)
      (req as any).session = { userId: user.id };

      res.json({ success: true, user });
    } catch (error: any) {
      console.error("Wallet auth error:", error);
      res.status(500).json({ error: error.message || "Wallet authentication failed" });
    }
  });

  // GET /api/charts - Get all charts for authenticated user
  app.get("/api/charts", isAuthenticated, async (req: any, res) => {
    try {
      // Get userId from session OR from query parameter (Privy wallet address)
      let userId = req.user?.claims?.sub || req.query.privyUserId || null;
      
      if (userId) {
        // Filter charts by user ID (works for both Replit and Privy auth)
        const charts = await storage.getChartsByUserId(userId);
        res.json(charts);
      } else {
        // No user context - return empty array for security
        console.warn("⚠️ No userId provided for /api/charts - returning empty array");
        res.json([]);
      }
    } catch (error: any) {
      console.error("Error getting charts:", error);
      res.status(500).json({ error: error.message || "Failed to get charts" });
    }
  });
  // GET /api/chart/:id - Get a chart by ID
  app.get("/api/chart/:id", async (req, res) => {
    try {
      const chart = await storage.getChart(req.params.id);
      if (!chart) {
        return res.status(404).json({ error: "Chart not found" });
      }
      res.json(chart);
    } catch (error: any) {
      console.error("Error getting chart:", error);
      res.status(500).json({ error: error.message || "Failed to get chart" });
    }
  });

  // POST /api/chart - Create a new natal chart (ZK MODE ONLY - Maximum Privacy)
  app.post("/api/chart", async (req, res) => {
    try {
      // Get userId from session OR from request body (Privy wallet address)
      let userId = (req as any).user?.claims?.sub || req.body.privyUserId || null;
      
      // ZK MODE ONLY: Client MUST provide pre-calculated positions + cryptographic proof
      // Server NEVER sees raw birth data - maximum privacy!
      if (req.body.zkEnabled !== true) {
        return res.status(400).json({
          error: "ZK mode required",
          message: "This application only accepts Zero-Knowledge chart creation for maximum privacy. Your birth data is calculated in your browser and never sent to the server."
        });
      }
      
      // Parse and validate ZK request
      const zkBody: CreateChartZKRequest = createChartZKRequestSchema.parse(req.body);

      // Ensure user exists in database (create if needed for Privy users)
      if (userId) {
        await storage.ensureUser(userId);
      }

        // VERIFY ZK PROOF using Poseidon hash (cryptographically sound)
        const { verifyZKProof } = await import('../lib/zkproof/poseidon-proof');
        
        const isValid = await verifyZKProof(
          zkBody.inputsHash, // commitment
          zkBody.zkProof,    // proof
          zkBody.zkSalt,     // nonce
          {
            planets: zkBody.params.planets,
            asc: zkBody.params.asc,
            mc: zkBody.params.mc
          }
        );

        if (!isValid) {
          return res.status(400).json({
            error: "ZK proof verification failed",
            message: "The cryptographic proof could not be verified. Please try regenerating your chart."
          });
        }
        
        console.log(`✅ ZK Proof verified for chart commitment: ${zkBody.inputsHash.slice(0, 16)}...`);
        
        // Save chart with VERIFIED ZK proof (raw birth data NEVER stored on server)
        const chart = await storage.createChart({
          userId: userId,
          inputsHash: zkBody.inputsHash,
          algoVersion: "western-equal-v1",
          paramsJson: zkBody.params,
          zkEnabled: true,
          zkProof: zkBody.zkProof,
          zkSalt: zkBody.zkSalt,
        });

        // 🔗 RECORD ON-CHAIN: Chart commitment to Base Sepolia
        // Transparent, immutable proof of chart existence
        const onChainResult = await import('../lib/blockchain/onchain-registry.js')
          .then(module => module.recordChartOnChain(
            chart.id,
            zkBody.params,
            userId,
            zkBody.zkProof
          ))
          .catch(err => {
            console.error('⚠️  On-chain recording failed (non-blocking):', err.message);
            return null;
          });

        return res.json({
          chartId: chart.id,
          params: zkBody.params,
          inputsHash: zkBody.inputsHash,
          zk: {
            enabled: true,
            proof: zkBody.zkProof,
            verified: true, // Cryptographically verified!
            algoVersion: "western-equal-v1",
            privacy: "maximum", // Birth data never touched the server!
          },
          onChain: onChainResult ? {
            recorded: true,
            txHash: onChainResult.txHash,
            chartHash: onChainResult.chartHash,
            explorer: `https://sepolia-explorer.base.org/tx/${onChainResult.txHash}`,
          } : {
            recorded: false,
            reason: 'Contracts not deployed or error occurred',
          },
        });
      } catch (error: any) {
        console.error("Error creating ZK chart:", error);
        
        // Provide helpful error messages
        if (error.message?.includes("parse")) {
          return res.status(400).json({ 
            error: "Invalid chart data",
            message: "Please ensure all required fields are provided and in the correct format."
          });
        }
        
        res.status(400).json({ 
          error: error.message || "Failed to create chart",
          message: "Chart creation failed. Please try again."
        });
      }
    });


  // GET /api/chart/:chartId/today-prediction - Get or create today's prediction
  app.get("/api/chart/:chartId/today-prediction", async (req, res) => {
    try {
      const { chartId } = req.params;

      // Get the chart
      const chart = await storage.getChart(chartId);
      if (!chart) {
        return res.status(404).json({ error: "Chart not found" });
      }

      // Get today's date (UTC, start of day)
      const today = DateTime.now().toUTC().startOf("day").toJSDate();

      // Check if there's already a prediction for today
      let request = await storage.getPredictionRequestByChartAndDate(chartId, today);

      // If no prediction exists for today, create one
      if (!request) {
        request = await storage.createPredictionRequest({
          userId: null,
          chartId: chartId,
          question: "What does today hold for me?",
          targetDate: today,
        });

        // Generate predictions asynchronously
        generatePredictionsAsync(request.id, chart, today);
      }

      res.json({ requestId: request.id, created: !request });
    } catch (error: any) {
      console.error("Error getting/creating today's prediction:", error);
      res.status(500).json({ error: error.message || "Failed to get today's prediction" });
    }
  });

  // POST /api/request - Create a prediction request
  app.post("/api/request", async (req, res) => {
    try {
      const body: CreatePredictionRequest = createPredictionRequestSchema.parse(req.body);

      // Get the chart
      const chart = await storage.getChart(body.chartId);
      if (!chart) {
        return res.status(404).json({ error: "Chart not found" });
      }

      // Parse target date
      const targetDateStr = body.targetDate || DateTime.now().toFormat("yyyy-MM-dd");
      const targetDate = DateTime.fromFormat(targetDateStr, "yyyy-MM-dd", { zone: "utc" })
        .startOf("day")
        .toJSDate();

      // Create prediction request
      const request = await storage.createPredictionRequest({
        userId: null,
        chartId: body.chartId,
        question: body.question,
        targetDate,
      });

      // Generate predictions asynchronously (don't wait)
      generatePredictionsAsync(request.id, chart, targetDate);

      res.json({ requestId: request.id });
    } catch (error: any) {
      console.error("Error creating request:", error);
      res.status(400).json({ error: error.message || "Failed to create request" });
    }
  });

  // GET /api/request/:id - Get prediction request with answers
  app.get("/api/request/:id", async (req, res) => {
    try {
      const request = await storage.getPredictionRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }

      const chart = await storage.getChart(request.chartId);
      const answers = await storage.getAnswersByRequestId(request.id);

      // Enrich answers with agent info
      const enrichedAnswers = await Promise.all(
        answers.map(async (answer) => {
          const agent = await storage.getAgent(answer.agentId);
          return {
            ...answer,
            agent: agent ? {
              handle: agent.handle,
              method: agent.method,
              reputation: agent.reputation,
            } : null,
          };
        })
      );

      res.json({
        request: {
          id: request.id,
          question: request.question,
          targetDate: request.targetDate,
          status: request.status,
          selectedAnswerId: request.selectedAnswerId,
        },
        chart: chart ? {
          id: chart.id,
          paramsJson: chart.paramsJson,
        } : null,
        answers: enrichedAnswers,
      });
    } catch (error: any) {
      console.error("Error getting request:", error);
      res.status(400).json({ error: error.message || "Failed to get request" });
    }
  });

  // POST /api/request/:id/select - Select winning prediction
  app.post("/api/request/:id/select", async (req, res) => {
    try {
      const body: SelectAnswerRequest = selectAnswerSchema.parse(req.body);
      
      const request = await storage.getPredictionRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }

      if (request.status === "SETTLED") {
        return res.status(400).json({ error: "Request already settled" });
      }

      // Get the selected answer
      const answers = await storage.getAnswersByRequestId(request.id);
      const selectedAnswer = answers.find(a => a.id === body.answerId);
      
      if (!selectedAnswer) {
        return res.status(404).json({ error: "Answer not found" });
      }

      // Update request status
      await storage.updatePredictionRequestStatus(request.id, "SETTLED", body.answerId);

      // Update agent reputation
      await storage.updateAgentReputation(selectedAnswer.agentId, 1);

      // Create reputation event
      await storage.createReputationEvent({
        agentId: selectedAnswer.agentId,
        requestId: request.id,
        delta: 1,
      });

      // 🔗 RECORD ON-CHAIN: Agent selection for transparent scoring
      // This makes agent reputation immutable and verifiable
      const userId = (req as any).user?.claims?.sub || null;
      const onChainTxHash = await import('../lib/blockchain/onchain-registry.js')
        .then(module => module.recordAgentSelectionOnChain(
          selectedAnswer.agentId,
          request.id,
          userId,
          1 // reputation bonus
        ))
        .catch(err => {
          console.error('⚠️  On-chain reputation update failed (non-blocking):', err.message);
          return null;
        });

      res.json({ 
        ok: true,
        onChain: onChainTxHash ? {
          recorded: true,
          txHash: onChainTxHash,
          explorer: `https://sepolia-explorer.base.org/tx/${onChainTxHash}`,
          message: 'Agent reputation updated on Base Sepolia',
        } : {
          recorded: false,
          reason: 'Contracts not deployed or error occurred',
        },
      });
    } catch (error: any) {
      console.error("Error selecting answer:", error);
      res.status(400).json({ error: error.message || "Failed to select answer" });
    }
  });

  // GET /api/request/:id/chat - Get chat messages for a prediction
  app.get("/api/request/:id/chat", async (req, res) => {
    try {
      const requestId = req.params.id;
      
      // Verify request exists
      const request = await storage.getPredictionRequest(requestId);
      if (!request) {
        return res.status(404).json({ error: "Prediction request not found" });
      }

      // Return empty messages - chat is now dynamic/not persisted
      // Each question gets a fresh contextual response
      res.json([]);
    } catch (error: any) {
      console.error("Error getting chat messages:", error);
      res.status(500).json({ error: error.message || "Failed to get chat messages" });
    }
  });

  // POST /api/request/:id/chat - Send a chat message
  app.post("/api/request/:id/chat", async (req, res) => {
    try {
      const requestId = req.params.id;
      const { message } = req.body;

      console.log(`📨 Chat message received for request ${requestId}:`, message);

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: "Message is required" });
      }

      // Get userId from session if authenticated
      let userId = (req as any).user?.claims?.sub || null;

      // Get prediction request and answers
      const request = await storage.getPredictionRequest(requestId);
      if (!request) {
        console.error(`❌ Request not found: ${requestId}`);
        return res.status(404).json({ error: "Prediction request not found" });
      }

      const answers = await storage.getAnswersByRequestId(requestId);
      if (answers.length === 0) {
        console.error(`❌ No answers found for request: ${requestId}`);
        return res.status(400).json({ error: "No predictions available yet" });
      }

      // Use the first answer's data for context (or selected answer if available)
      const primaryAnswer = request.selectedAnswerId 
        ? answers.find(a => a.id === request.selectedAnswerId) || answers[0]
        : answers[0];

      // Parse factors
      const transitFactors = primaryAnswer.factors.split('\n').filter(f => f.trim());

      // No conversation history - each question is answered fresh with full prediction context
      // This keeps responses focused and practical
      const conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

      // Generate AI response
      console.log('🤖 Generating AI response...');
      const { generateChatResponse } = await import('../lib/agents/llm');
      const aiResponse = await generateChatResponse(
        message,
        {
          dayScore: primaryAnswer.dayScore,
          transitFactors,
          predictionSummary: primaryAnswer.summary,
          targetDate: request.targetDate.toISOString(),
        },
        conversationHistory
      );

      console.log('✅ AI response generated:', aiResponse.substring(0, 100) + '...');

      // Return dynamic response without saving to database
      // This keeps the chat lightweight and contextual
      res.json({
        userMessage: {
          id: `temp-${Date.now()}-user`,
          predictionRequestId: requestId,
          userId,
          role: 'user',
          content: message,
          createdAt: new Date(),
          context: null,
        },
        assistantMessage: {
          id: `temp-${Date.now()}-assistant`,
          predictionRequestId: requestId,
          userId: null,
          role: 'assistant',
          content: aiResponse,
          createdAt: new Date(),
          context: null,
        },
      });
    } catch (error: any) {
      console.error("❌ Error sending chat message:", error);
      res.status(500).json({ error: error.message || "Failed to send message" });
    }
  });

  // GET /api/agents - List all agents
  app.get("/api/agents", async (req, res) => {
    try {
      const agents = await storage.getAllAgents();
      res.json(agents);
    } catch (error: any) {
      console.error("Error getting agents:", error);
      res.status(500).json({ error: "Failed to get agents" });
    }
  });

  // GET /api/agents/stats - Get agents with performance metrics
  app.get("/api/agents/stats", async (req, res) => {
    try {
      const stats = await storage.getAgentStats();
      res.json(stats);
    } catch (error: any) {
      console.error("Error getting agent stats:", error);
      res.status(500).json({ error: "Failed to get agent stats" });
    }
  });

  // Setup admin routes for agent deployment and management
  setupAdminRoutes(app);

  // Agent creation routes (public)
  app.post('/api/admin/agents/create', createAgentHandler);
  app.get('/api/agents/creation-stats', getAgentCreationStats);

  const httpServer = createServer(app);
  return httpServer;
}

// Async function to generate predictions
async function generatePredictionsAsync(
  requestId: string,
  chart: any,
  targetDate: Date
) {
  try {
    // Get active agents
    const agents = await storage.getAllActiveAgents();
    
    // Select 2 agents using weighted random sampling
    const selectedAgents = selectAgents(agents, 2);

    // Calculate transit positions for target date
    const transitDateTime = DateTime.fromJSDate(targetDate, { zone: "utc" }).set({
      hour: 12,
      minute: 0,
      second: 0,
    });
    
    const { planets: transitPlanets, retro: transitRetro } = calculatePlanetaryPositions(transitDateTime);

    const natalChart = chart.paramsJson;
    const transitChart = {
      planets: transitPlanets,
      retro: transitRetro,
    };

    // Generate predictions from selected agents
    for (const agent of selectedAgents) {
      let prediction;
      
      if (agent.handle === "@auriga") {
        prediction = await generateAurigaPrediction(
          natalChart,
          transitChart,
          "How will my day go?",
          targetDate.toISOString().split('T')[0]
        );
      } else if (agent.handle === "@nova") {
        prediction = await generateNovaPrediction(
          natalChart,
          transitChart,
          "How will my day go?",
          targetDate.toISOString().split('T')[0]
        );
      } else {
        // Fallback for other agents
        prediction = await generateNovaPrediction(
          natalChart,
          transitChart,
          "How will my day go?",
          targetDate.toISOString().split('T')[0]
        );
      }

      await storage.createPredictionAnswer({
        requestId,
        agentId: agent.id,
        summary: prediction.summary,
        highlights: prediction.highlights,
        dayScore: prediction.dayScore,
        factors: prediction.factors,
      });
    }

    // Update request status to ANSWERED
    await storage.updatePredictionRequestStatus(requestId, "ANSWERED");
  } catch (error) {
    console.error("Error generating predictions:", error);
  }
}

// Weighted random agent selection
function selectAgents(agents: any[], count: number): any[] {
  if (agents.length === 0) return [];
  if (agents.length <= count) return agents;

  const selected: any[] = [];
  const available = [...agents];

  for (let i = 0; i < count; i++) {
    // Calculate weights (reputation + 1 to avoid zero weight)
    const weights = available.map(a => a.reputation + 1);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    // Random selection based on weight
    let random = Math.random() * totalWeight;
    let selectedIndex = 0;

    for (let j = 0; j < weights.length; j++) {
      random -= weights[j];
      if (random <= 0) {
        selectedIndex = j;
        break;
      }
    }

    selected.push(available[selectedIndex]);
    available.splice(selectedIndex, 1);
  }

  return selected;
}
