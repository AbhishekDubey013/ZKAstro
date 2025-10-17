import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { DateTime } from "luxon";
import crypto from "crypto";
import { calculatePlanetaryPositions } from "../lib/astro/planets";
import { calculateAscendant } from "../lib/astro/equalHouses";
import { generateAurigaPrediction } from "../lib/agents/agentA";
import { generateNovaPrediction } from "../lib/agents/agentB";
import {
  createChartRequestSchema,
  createPredictionRequestSchema,
  selectAnswerSchema,
  type CreateChartRequest,
  type CreatePredictionRequest,
  type SelectAnswerRequest,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // POST /api/chart - Create a new natal chart
  app.post("/api/chart", async (req, res) => {
    try {
      const body: CreateChartRequest = createChartRequestSchema.parse(req.body);
      
      // Convert to UTC using timezone
      const localDateTime = DateTime.fromFormat(
        `${body.dob} ${body.tob}`,
        "yyyy-MM-dd HH:mm",
        { zone: body.tz }
      );
      
      if (!localDateTime.isValid) {
        return res.status(400).json({ error: "Invalid date/time or timezone" });
      }

      const utcDateTime = localDateTime.toUTC();

      // Calculate planetary positions
      const { planets, retro } = calculatePlanetaryPositions(utcDateTime);
      
      // Calculate Ascendant and MC
      const { asc, mc } = calculateAscendant(utcDateTime, body.place.lat, body.place.lon);

      // Create input hash for privacy
      const inputString = `${body.dob}|${body.tob}|${body.place.lat}|${body.place.lon}|${crypto.randomBytes(16).toString('hex')}`;
      const inputsHash = crypto.createHash('sha256').update(inputString).digest('hex');

      // Prepare chart params
      const paramsJson = {
        quant: "centi-deg",
        zodiac: "tropical",
        houseSystem: "equal",
        planets,
        retro,
        asc,
        mc,
      };

      // Save chart to database
      const chart = await storage.createChart({
        userId: null, // Anonymous for MVP
        inputsHash,
        algoVersion: "western-equal-v1",
        paramsJson,
        zkEnabled: body.zk || false,
      });

      res.json({
        chartId: chart.id,
        params: paramsJson,
        inputsHash,
        zk: {
          enabled: false, // ZK disabled for MVP
          ephemerisRoot: null,
          algoVersion: "western-equal-v1",
        },
      });
    } catch (error: any) {
      console.error("Error creating chart:", error);
      res.status(400).json({ error: error.message || "Failed to create chart" });
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

      res.json({ ok: true });
    } catch (error: any) {
      console.error("Error selecting answer:", error);
      res.status(400).json({ error: error.message || "Failed to select answer" });
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
