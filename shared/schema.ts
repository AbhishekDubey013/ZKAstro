import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, real } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  reputation: integer("reputation").default(0).notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  charts: many(charts),
  requests: many(predictionRequests),
}));

// Charts table - stores natal chart data
export const charts = pgTable("charts", {
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

// Agents table - AI astrology agents
export const agents = pgTable("agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  handle: text("handle").unique().notNull(),
  method: text("method").notNull(),
  description: text("description").notNull(),
  reputation: integer("reputation").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const agentsRelations = relations(agents, ({ many }) => ({
  answers: many(predictionAnswers),
  reputationEvents: many(reputationEvents),
}));

// Prediction requests table
export const predictionRequests = pgTable("prediction_requests", {
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
}));

// Prediction answers table
export const predictionAnswers = pgTable("prediction_answers", {
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
export const reputationEvents = pgTable("reputation_events", {
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

export type CreateChartRequest = z.infer<typeof createChartRequestSchema>;
export type CreatePredictionRequest = z.infer<typeof createPredictionRequestSchema>;
export type SelectAnswerRequest = z.infer<typeof selectAnswerSchema>;
