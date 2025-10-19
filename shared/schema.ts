import { sql } from "drizzle-orm";
import { pgTable, pgSchema, text, varchar, timestamp, integer, boolean, jsonb, real, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Use a dedicated schema for ZKastro to avoid conflicts with existing tables
export const zkastroSchema = pgSchema("zkastro");

// Session storage table for Replit Auth
export const sessions = zkastroSchema.table(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table - extended for Replit Auth
export const users = zkastroSchema.table("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  reputation: integer("reputation").default(0).notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  charts: many(charts),
  requests: many(predictionRequests),
}));

// Charts table - stores natal chart data
export const charts = zkastroSchema.table("charts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  inputsHash: text("inputs_hash").notNull(),
  algoVersion: text("algo_version").notNull().default("western-equal-v1"),
  paramsJson: jsonb("params_json").notNull().$type<{
    quant: string;
    zodiac: string;
    houseSystem: string;
    planets: {
      sun: number;
      moon: number;
      mercury: number;
      venus: number;
      mars: number;
      jupiter: number;
      saturn: number;
    };
    retro: {
      mercury: boolean;
      venus: boolean;
      mars: boolean;
      jupiter: boolean;
      saturn: boolean;
    };
    asc: number;
    mc: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // ZK / on-chain fields (optional)
  zkEnabled: boolean("zk_enabled").default(false).notNull(),
  zkProof: text("zk_proof"), // ZK proof that positions were correctly calculated
  zkSalt: text("zk_salt"), // Salt used for commitment
  ephemerisRoot: text("ephemeris_root"),
  pCid: text("p_cid"),
  chain: text("chain"),
  chartIdOnChain: text("chart_id_on_chain"),
  txHash: text("tx_hash"),
});

export const chartsRelations = relations(charts, ({ one, many }) => ({
  user: one(users, {
    fields: [charts.userId],
    references: [users.id],
  }),
  requests: many(predictionRequests),
}));

// Agents table - AI astrology agents (decentralized via Virtuals GAME SDK)
export const agents = zkastroSchema.table("agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  handle: text("handle").unique().notNull(),
  method: text("method").notNull(),
  description: text("description").notNull(),
  reputation: integer("reputation").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Virtuals GAME SDK / On-chain fields
  contractAddress: text("contract_address"), // Deployed agent contract on Base Sepolia
  deploymentTx: text("deployment_tx"), // Deployment transaction hash
  chainId: integer("chain_id").default(84532), // Base Sepolia
  tokenAddress: text("token_address"), // Agent token (if tokenized)
  personality: text("personality"), // Agent's personality/approach
  aggressiveness: real("aggressiveness").default(1.0), // Scoring bias (0.5-1.5)
});

export const agentsRelations = relations(agents, ({ many }) => ({
  answers: many(predictionAnswers),
  reputationEvents: many(reputationEvents),
}));

// Prediction requests table
export const predictionRequests = zkastroSchema.table("prediction_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  chartId: varchar("chart_id").references(() => charts.id).notNull(),
  question: text("question").notNull(),
  targetDate: timestamp("target_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  status: text("status").default("OPEN").notNull(), // OPEN | ANSWERED | SETTLED
  selectedAnswerId: varchar("selected_answer_id"),
});

export const predictionRequestsRelations = relations(predictionRequests, ({ one, many }) => ({
  user: one(users, {
    fields: [predictionRequests.userId],
    references: [users.id],
  }),
  chart: one(charts, {
    fields: [predictionRequests.chartId],
    references: [charts.id],
  }),
  answers: many(predictionAnswers),
  chatMessages: many(chatMessages),
}));

// Prediction answers table
export const predictionAnswers = zkastroSchema.table("prediction_answers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id").references(() => predictionRequests.id).notNull(),
  agentId: varchar("agent_id").references(() => agents.id).notNull(),
  summary: text("summary").notNull(),
  highlights: text("highlights").notNull(),
  dayScore: real("day_score").notNull(),
  factors: text("factors").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const predictionAnswersRelations = relations(predictionAnswers, ({ one }) => ({
  request: one(predictionRequests, {
    fields: [predictionAnswers.requestId],
    references: [predictionRequests.id],
  }),
  agent: one(agents, {
    fields: [predictionAnswers.agentId],
    references: [agents.id],
  }),
}));

// Reputation events table
export const reputationEvents = zkastroSchema.table("reputation_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").references(() => agents.id).notNull(),
  requestId: varchar("request_id").notNull(),
  delta: integer("delta").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reputationEventsRelations = relations(reputationEvents, ({ one }) => ({
  agent: one(agents, {
    fields: [reputationEvents.agentId],
    references: [agents.id],
  }),
}));

// Chat messages table - Interactive Q&A about predictions
export const chatMessages = zkastroSchema.table("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  predictionRequestId: varchar("prediction_request_id").references(() => predictionRequests.id).notNull(),
  userId: varchar("user_id").references(() => users.id),
  role: text("role").notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  context: jsonb("context").$type<{
    dayScore?: number;
    transitFactors?: string[];
    agentPersonality?: string;
  }>(), // Astrological context
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  predictionRequest: one(predictionRequests, {
    fields: [chatMessages.predictionRequestId],
    references: [predictionRequests.id],
  }),
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  reputation: true,
});

export const insertChartSchema = createInsertSchema(charts).omit({
  id: true,
  createdAt: true,
});

export const insertAgentSchema = createInsertSchema(agents).omit({
  id: true,
  createdAt: true,
});

export const insertPredictionRequestSchema = createInsertSchema(predictionRequests).omit({
  id: true,
  createdAt: true,
  status: true,
  selectedAnswerId: true,
});

export const insertPredictionAnswerSchema = createInsertSchema(predictionAnswers).omit({
  id: true,
  createdAt: true,
});

export const insertReputationEventSchema = createInsertSchema(reputationEvents).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

// API request/response schemas
export const createChartRequestSchema = z.object({
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tob: z.string().regex(/^\d{2}:\d{2}$/),
  tz: z.string(), // IANA timezone
  place: z.object({
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
  }),
  privacyMode: z.enum(["normal", "strict"]).optional(),
  zk: z.boolean().optional(),
});

// ZK mode chart creation - client provides pre-calculated positions
export const createChartZKRequestSchema = z.object({
  zkEnabled: z.literal(true),
  inputsHash: z.string(), // Commitment to birth data
  zkProof: z.string(), // Proof of correct calculation
  zkSalt: z.string(), // Salt for verification
  params: z.object({
    quant: z.literal("centi-deg"),
    zodiac: z.literal("tropical"),
    houseSystem: z.literal("equal"),
    planets: z.object({
      sun: z.number(),
      moon: z.number(),
      mercury: z.number(),
      venus: z.number(),
      mars: z.number(),
      jupiter: z.number(),
      saturn: z.number(),
    }),
    retro: z.object({
      mercury: z.boolean(),
      venus: z.boolean(),
      mars: z.boolean(),
      jupiter: z.boolean(),
      saturn: z.boolean(),
    }),
    asc: z.number(),
    mc: z.number(),
  }),
});

export const createPredictionRequestSchema = z.object({
  chartId: z.string(),
  question: z.string().min(1).max(500),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const selectAnswerSchema = z.object({
  answerId: z.string(),
});

// TypeScript types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;

export type Chart = typeof charts.$inferSelect;
export type InsertChart = z.infer<typeof insertChartSchema>;

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = z.infer<typeof insertAgentSchema>;

export type PredictionRequest = typeof predictionRequests.$inferSelect;
export type InsertPredictionRequest = z.infer<typeof insertPredictionRequestSchema>;

export type PredictionAnswer = typeof predictionAnswers.$inferSelect;
export type InsertPredictionAnswer = z.infer<typeof insertPredictionAnswerSchema>;

export type ReputationEvent = typeof reputationEvents.$inferSelect;
export type InsertReputationEvent = z.infer<typeof insertReputationEventSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type CreateChartRequest = z.infer<typeof createChartRequestSchema>;
export type CreateChartZKRequest = z.infer<typeof createChartZKRequestSchema>;
export type CreatePredictionRequest = z.infer<typeof createPredictionRequestSchema>;
export type SelectAnswerRequest = z.infer<typeof selectAnswerSchema>;
