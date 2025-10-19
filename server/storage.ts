import {
  users,
  charts,
  agents,
  predictionRequests,
  predictionAnswers,
  reputationEvents,
  chatMessages,
  type User,
  type InsertUser,
  type UpsertUser,
  type Chart,
  type InsertChart,
  type Agent,
  type InsertAgent,
  type PredictionRequest,
  type InsertPredictionRequest,
  type PredictionAnswer,
  type InsertPredictionAnswer,
  type ReputationEvent,
  type InsertReputationEvent,
  type ChatMessage,
  type InsertChatMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Charts
  getChart(id: string): Promise<Chart | undefined>;
  getChartsByUserId(userId: string): Promise<Chart[]>;
  getAllCharts(): Promise<Chart[]>;
  createChart(chart: InsertChart): Promise<Chart>;

  // Agents
  getAgent(id: string): Promise<Agent | undefined>;
  getAgentByHandle(handle: string): Promise<Agent | undefined>;
  getAllActiveAgents(): Promise<Agent[]>;
  getAllAgents(): Promise<Agent[]>;
  getAgentStats(): Promise<any[]>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgentReputation(id: string, delta: number): Promise<void>;

  // Prediction Requests
  getPredictionRequest(id: string): Promise<PredictionRequest | undefined>;
  getPredictionRequestByChartAndDate(chartId: string, targetDate: Date): Promise<PredictionRequest | undefined>;
  createPredictionRequest(request: InsertPredictionRequest): Promise<PredictionRequest>;
  updatePredictionRequestStatus(id: string, status: string, selectedAnswerId?: string): Promise<void>;

  // Prediction Answers
  createPredictionAnswer(answer: InsertPredictionAnswer): Promise<PredictionAnswer>;
  getAnswersByRequestId(requestId: string): Promise<PredictionAnswer[]>;

  // Reputation Events
  createReputationEvent(event: InsertReputationEvent): Promise<ReputationEvent>;

  // Chat Messages
  getChatMessages(predictionRequestId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Charts
  async getChart(id: string): Promise<Chart | undefined> {
    const [chart] = await db.select().from(charts).where(eq(charts.id, id));
    return chart || undefined;
  }

  async getChartsByUserId(userId: string): Promise<Chart[]> {
    return await db.select().from(charts).where(eq(charts.userId, userId)).orderBy(desc(charts.createdAt));
  }

  async getAllCharts(): Promise<Chart[]> {
    return await db.select().from(charts).orderBy(desc(charts.createdAt));
  }

  async createChart(insertChart: InsertChart): Promise<Chart> {
    const [chart] = await db.insert(charts).values(insertChart).returning();
    return chart;
  }

  // Agents
  async getAgent(id: string): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));
    return agent || undefined;
  }

  async getAgentByHandle(handle: string): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.handle, handle));
    return agent || undefined;
  }

  async getAllActiveAgents(): Promise<Agent[]> {
    return await db
      .select()
      .from(agents)
      .where(eq(agents.isActive, true))
      .orderBy(desc(agents.reputation));
  }

  async getAllAgents(): Promise<Agent[]> {
    return await db.select().from(agents).orderBy(desc(agents.reputation));
  }

  async getAgentStats(): Promise<any[]> {
    const result = await db.execute(`
      SELECT 
        a.id,
        a.handle,
        a.method,
        a.description,
        a.reputation,
        a.is_active,
        a.created_at,
        COUNT(DISTINCT pa.id) as total_predictions,
        COUNT(DISTINCT CASE WHEN pr.selected_answer_id = pa.id THEN pa.id END) as wins,
        ROUND(CAST(AVG(pa.day_score) AS NUMERIC), 1) as avg_score
      FROM zkastro.agents a
      LEFT JOIN zkastro.prediction_answers pa ON pa.agent_id = a.id
      LEFT JOIN zkastro.prediction_requests pr ON pr.id = pa.request_id
      GROUP BY a.id, a.handle, a.method, a.description, a.reputation, a.is_active, a.created_at
      ORDER BY a.reputation DESC
    `);
    return result.rows;
  }

  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const [agent] = await db.insert(agents).values(insertAgent).returning();
    return agent;
  }

  async updateAgentReputation(id: string, delta: number): Promise<void> {
    const agent = await this.getAgent(id);
    if (agent) {
      await db
        .update(agents)
        .set({ reputation: agent.reputation + delta })
        .where(eq(agents.id, id));
    }
  }

  // Prediction Requests
  async getPredictionRequest(id: string): Promise<PredictionRequest | undefined> {
    const [request] = await db
      .select()
      .from(predictionRequests)
      .where(eq(predictionRequests.id, id));
    return request || undefined;
  }

  async getPredictionRequestByChartAndDate(chartId: string, targetDate: Date): Promise<PredictionRequest | undefined> {
    const [request] = await db
      .select()
      .from(predictionRequests)
      .where(
        and(
          eq(predictionRequests.chartId, chartId),
          eq(predictionRequests.targetDate, targetDate)
        )
      )
      .limit(1);
    return request || undefined;
  }

  async createPredictionRequest(insertRequest: InsertPredictionRequest): Promise<PredictionRequest> {
    const [request] = await db
      .insert(predictionRequests)
      .values(insertRequest)
      .returning();
    return request;
  }

  async updatePredictionRequestStatus(
    id: string,
    status: string,
    selectedAnswerId?: string
  ): Promise<void> {
    await db
      .update(predictionRequests)
      .set({ status, selectedAnswerId })
      .where(eq(predictionRequests.id, id));
  }

  // Prediction Answers
  async createPredictionAnswer(insertAnswer: InsertPredictionAnswer): Promise<PredictionAnswer> {
    const [answer] = await db
      .insert(predictionAnswers)
      .values(insertAnswer)
      .returning();
    return answer;
  }

  async getAnswersByRequestId(requestId: string): Promise<PredictionAnswer[]> {
    return await db
      .select()
      .from(predictionAnswers)
      .where(eq(predictionAnswers.requestId, requestId));
  }

  // Reputation Events
  async createReputationEvent(insertEvent: InsertReputationEvent): Promise<ReputationEvent> {
    const [event] = await db
      .insert(reputationEvents)
      .values(insertEvent)
      .returning();
    return event;
  }

  // Chat Messages
  async getChatMessages(predictionRequestId: string): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.predictionRequestId, predictionRequestId))
      .orderBy(chatMessages.createdAt);
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values(insertMessage)
      .returning();
    return message;
  }
}

export const storage = new DatabaseStorage();
