CREATE SCHEMA "zkastro";
--> statement-breakpoint
CREATE TABLE "zkastro"."agents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"handle" text NOT NULL,
	"method" text NOT NULL,
	"description" text NOT NULL,
	"reputation" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"contract_address" text,
	"deployment_tx" text,
	"chain_id" integer DEFAULT 84532,
	"token_address" text,
	"personality" text,
	"aggressiveness" real DEFAULT 1,
	CONSTRAINT "agents_handle_unique" UNIQUE("handle")
);
--> statement-breakpoint
CREATE TABLE "zkastro"."charts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"inputs_hash" text NOT NULL,
	"algo_version" text DEFAULT 'western-equal-v1' NOT NULL,
	"params_json" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"zk_enabled" boolean DEFAULT false NOT NULL,
	"zk_proof" text,
	"zk_salt" text,
	"ephemeris_root" text,
	"p_cid" text,
	"chain" text,
	"chart_id_on_chain" text,
	"tx_hash" text
);
--> statement-breakpoint
CREATE TABLE "zkastro"."chat_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prediction_request_id" varchar NOT NULL,
	"user_id" varchar,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"context" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zkastro"."farcaster_predictions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"date" text NOT NULL,
	"prediction" text NOT NULL,
	"lucky_number" integer NOT NULL,
	"lucky_color" text NOT NULL,
	"mood" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zkastro"."farcaster_ratings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"date" text NOT NULL,
	"rating" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zkastro"."farcaster_users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"dob" text NOT NULL,
	"tob" text NOT NULL,
	"location" text NOT NULL,
	"lat" real NOT NULL,
	"lon" real NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "farcaster_users_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "zkastro"."prediction_answers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" varchar NOT NULL,
	"agent_id" varchar NOT NULL,
	"summary" text NOT NULL,
	"highlights" text NOT NULL,
	"day_score" real NOT NULL,
	"factors" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zkastro"."prediction_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"chart_id" varchar NOT NULL,
	"question" text NOT NULL,
	"target_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"selected_answer_id" varchar
);
--> statement-breakpoint
CREATE TABLE "zkastro"."reputation_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" varchar NOT NULL,
	"request_id" varchar NOT NULL,
	"delta" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zkastro"."sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zkastro"."users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"reputation" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "zkastro"."charts" ADD CONSTRAINT "charts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "zkastro"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zkastro"."chat_messages" ADD CONSTRAINT "chat_messages_prediction_request_id_prediction_requests_id_fk" FOREIGN KEY ("prediction_request_id") REFERENCES "zkastro"."prediction_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zkastro"."chat_messages" ADD CONSTRAINT "chat_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "zkastro"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zkastro"."prediction_answers" ADD CONSTRAINT "prediction_answers_request_id_prediction_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "zkastro"."prediction_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zkastro"."prediction_answers" ADD CONSTRAINT "prediction_answers_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "zkastro"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zkastro"."prediction_requests" ADD CONSTRAINT "prediction_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "zkastro"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zkastro"."prediction_requests" ADD CONSTRAINT "prediction_requests_chart_id_charts_id_fk" FOREIGN KEY ("chart_id") REFERENCES "zkastro"."charts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zkastro"."reputation_events" ADD CONSTRAINT "reputation_events_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "zkastro"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "zkastro"."sessions" USING btree ("expire");