-- ============================================
-- Complete Database Setup for ZKastro
-- Run this in Neon Console SQL Editor
-- ============================================

-- Step 1: Create the zkastro schema
CREATE SCHEMA IF NOT EXISTS zkastro;

-- Step 2: Create all tables
-- ============================================

-- Sessions table
CREATE TABLE IF NOT EXISTS zkastro.sessions (
	sid varchar PRIMARY KEY NOT NULL,
	sess jsonb NOT NULL,
	expire timestamp NOT NULL
);

CREATE INDEX IF NOT EXISTS IDX_session_expire ON zkastro.sessions USING btree (expire);

-- Users table
CREATE TABLE IF NOT EXISTS zkastro.users (
	id varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	email text,
	first_name varchar,
	last_name varchar,
	profile_image_url varchar,
	created_at timestamp DEFAULT now() NOT NULL,
	updated_at timestamp DEFAULT now() NOT NULL,
	reputation integer DEFAULT 0 NOT NULL,
	CONSTRAINT users_email_unique UNIQUE(email)
);

-- Agents table
CREATE TABLE IF NOT EXISTS zkastro.agents (
	id varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	handle text NOT NULL,
	method text NOT NULL,
	description text NOT NULL,
	reputation integer DEFAULT 0 NOT NULL,
	is_active boolean DEFAULT true NOT NULL,
	created_at timestamp DEFAULT now() NOT NULL,
	contract_address text,
	deployment_tx text,
	chain_id integer DEFAULT 84532,
	token_address text,
	personality text,
	aggressiveness real DEFAULT 1,
	CONSTRAINT agents_handle_unique UNIQUE(handle)
);

-- Charts table
CREATE TABLE IF NOT EXISTS zkastro.charts (
	id varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	user_id varchar,
	inputs_hash text NOT NULL,
	algo_version text DEFAULT 'western-equal-v1' NOT NULL,
	params_json jsonb NOT NULL,
	created_at timestamp DEFAULT now() NOT NULL,
	zk_enabled boolean DEFAULT false NOT NULL,
	zk_proof text,
	zk_salt text,
	ephemeris_root text,
	p_cid text,
	chain text,
	chart_id_on_chain text,
	tx_hash text
);

-- Farcaster users table
CREATE TABLE IF NOT EXISTS zkastro.farcaster_users (
	id varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	user_id text NOT NULL,
	dob text NOT NULL,
	tob text NOT NULL,
	location text NOT NULL,
	lat real NOT NULL,
	lon real NOT NULL,
	created_at timestamp DEFAULT now() NOT NULL,
	updated_at timestamp DEFAULT now() NOT NULL,
	CONSTRAINT farcaster_users_user_id_unique UNIQUE(user_id)
);

-- Farcaster predictions table
CREATE TABLE IF NOT EXISTS zkastro.farcaster_predictions (
	id varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	user_id text NOT NULL,
	date text NOT NULL,
	prediction text NOT NULL,
	lucky_number integer NOT NULL,
	lucky_color text NOT NULL,
	mood text NOT NULL,
	created_at timestamp DEFAULT now() NOT NULL
);

-- Farcaster ratings table
CREATE TABLE IF NOT EXISTS zkastro.farcaster_ratings (
	id varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	user_id text NOT NULL,
	date text NOT NULL,
	rating integer NOT NULL,
	created_at timestamp DEFAULT now() NOT NULL,
	updated_at timestamp DEFAULT now() NOT NULL
);

-- Prediction requests table
CREATE TABLE IF NOT EXISTS zkastro.prediction_requests (
	id varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	user_id varchar,
	chart_id varchar NOT NULL,
	question text NOT NULL,
	target_date timestamp NOT NULL,
	created_at timestamp DEFAULT now() NOT NULL,
	status text DEFAULT 'OPEN' NOT NULL,
	selected_answer_id varchar
);

-- Prediction answers table
CREATE TABLE IF NOT EXISTS zkastro.prediction_answers (
	id varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	request_id varchar NOT NULL,
	agent_id varchar NOT NULL,
	summary text NOT NULL,
	highlights text NOT NULL,
	day_score real NOT NULL,
	factors text NOT NULL,
	created_at timestamp DEFAULT now() NOT NULL
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS zkastro.chat_messages (
	id varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	prediction_request_id varchar NOT NULL,
	user_id varchar,
	role text NOT NULL,
	content text NOT NULL,
	context jsonb,
	created_at timestamp DEFAULT now() NOT NULL
);

-- Reputation events table
CREATE TABLE IF NOT EXISTS zkastro.reputation_events (
	id varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	agent_id varchar NOT NULL,
	request_id varchar NOT NULL,
	delta integer NOT NULL,
	created_at timestamp DEFAULT now() NOT NULL
);

-- Step 3: Add foreign key constraints
-- ============================================

-- Only add if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'charts_user_id_users_id_fk'
    ) THEN
        ALTER TABLE zkastro.charts 
        ADD CONSTRAINT charts_user_id_users_id_fk 
        FOREIGN KEY (user_id) REFERENCES zkastro.users(id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chat_messages_prediction_request_id_prediction_requests_id_fk'
    ) THEN
        ALTER TABLE zkastro.chat_messages 
        ADD CONSTRAINT chat_messages_prediction_request_id_prediction_requests_id_fk 
        FOREIGN KEY (prediction_request_id) REFERENCES zkastro.prediction_requests(id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chat_messages_user_id_users_id_fk'
    ) THEN
        ALTER TABLE zkastro.chat_messages 
        ADD CONSTRAINT chat_messages_user_id_users_id_fk 
        FOREIGN KEY (user_id) REFERENCES zkastro.users(id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'prediction_answers_request_id_prediction_requests_id_fk'
    ) THEN
        ALTER TABLE zkastro.prediction_answers 
        ADD CONSTRAINT prediction_answers_request_id_prediction_requests_id_fk 
        FOREIGN KEY (request_id) REFERENCES zkastro.prediction_requests(id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'prediction_answers_agent_id_agents_id_fk'
    ) THEN
        ALTER TABLE zkastro.prediction_answers 
        ADD CONSTRAINT prediction_answers_agent_id_agents_id_fk 
        FOREIGN KEY (agent_id) REFERENCES zkastro.agents(id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'prediction_requests_user_id_users_id_fk'
    ) THEN
        ALTER TABLE zkastro.prediction_requests 
        ADD CONSTRAINT prediction_requests_user_id_users_id_fk 
        FOREIGN KEY (user_id) REFERENCES zkastro.users(id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'prediction_requests_chart_id_charts_id_fk'
    ) THEN
        ALTER TABLE zkastro.prediction_requests 
        ADD CONSTRAINT prediction_requests_chart_id_charts_id_fk 
        FOREIGN KEY (chart_id) REFERENCES zkastro.charts(id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'reputation_events_agent_id_agents_id_fk'
    ) THEN
        ALTER TABLE zkastro.reputation_events 
        ADD CONSTRAINT reputation_events_agent_id_agents_id_fk 
        FOREIGN KEY (agent_id) REFERENCES zkastro.agents(id);
    END IF;
END $$;

-- Step 4: Insert sample data
-- ============================================

-- Sample users
INSERT INTO zkastro.users (email, first_name, last_name, reputation) VALUES
('john.doe@example.com', 'John', 'Doe', 150),
('jane.smith@example.com', 'Jane', 'Smith', 200),
('alice.wonder@example.com', 'Alice', 'Wonder', 75),
('bob.builder@example.com', 'Bob', 'Builder', 300),
('sarah.connor@example.com', 'Sarah', 'Connor', 500)
ON CONFLICT (email) DO NOTHING;

-- Sample agents
INSERT INTO zkastro.agents (handle, method, description, reputation, personality, aggressiveness) VALUES
('sage_astrologer', 'western-tropical', 'A wise and balanced astrologer focusing on traditional Western techniques', 500, 'wise and balanced', 1.0),
('mystic_seer', 'vedic-sidereal', 'Mystical Vedic astrologer with deep spiritual insights', 450, 'mystical and spiritual', 1.2),
('cosmic_oracle', 'evolutionary-astrology', 'Modern evolutionary astrologer focused on soul growth', 380, 'progressive and insightful', 0.9),
('star_guide', 'psychological-astrology', 'Jungian psychological astrologer exploring the unconscious', 420, 'analytical and deep', 1.1)
ON CONFLICT (handle) DO NOTHING;

-- Sample Farcaster users
INSERT INTO zkastro.farcaster_users (user_id, dob, tob, location, lat, lon) VALUES
('fc_user_12345', '1995-05-15', '14:30', 'New York, USA', 40.7128, -74.0060),
('fc_user_67890', '1988-11-22', '08:45', 'London, UK', 51.5074, -0.1278),
('fc_user_11111', '1992-03-08', '20:15', 'Tokyo, Japan', 35.6762, 139.6503),
('fc_user_22222', '1985-07-30', '12:00', 'Sydney, Australia', -33.8688, 151.2093)
ON CONFLICT (user_id) DO NOTHING;

-- Sample Farcaster predictions
INSERT INTO zkastro.farcaster_predictions (user_id, date, prediction, lucky_number, lucky_color, mood) VALUES
('fc_user_12345', '2025-10-27', 'A day of creative breakthroughs! Your Mercury-Venus conjunction brings harmonious communication.', 7, 'Blue', 'Optimistic'),
('fc_user_67890', '2025-10-27', 'Focus on relationships today. Mars in your 7th house energizes partnerships.', 3, 'Red', 'Passionate'),
('fc_user_11111', '2025-10-27', 'Financial opportunities arise. Jupiter trine your Sun brings abundance.', 8, 'Green', 'Confident'),
('fc_user_22222', '2025-10-27', 'Time for introspection. Moon in 12th house encourages spiritual reflection.', 2, 'Purple', 'Contemplative');

-- Sample Farcaster ratings
INSERT INTO zkastro.farcaster_ratings (user_id, date, rating) VALUES
('fc_user_12345', '2025-10-26', 5),
('fc_user_67890', '2025-10-26', 4),
('fc_user_11111', '2025-10-26', 5),
('fc_user_22222', '2025-10-26', 3);

-- Step 5: Verification queries
-- ============================================

-- List all tables
SELECT 
    tablename as "Table Name",
    schemaname as "Schema"
FROM pg_tables 
WHERE schemaname = 'zkastro'
ORDER BY tablename;

-- Count rows in each table
SELECT 'users' as table_name, COUNT(*) as row_count FROM zkastro.users
UNION ALL
SELECT 'agents', COUNT(*) FROM zkastro.agents
UNION ALL
SELECT 'charts', COUNT(*) FROM zkastro.charts
UNION ALL
SELECT 'farcaster_users', COUNT(*) FROM zkastro.farcaster_users
UNION ALL
SELECT 'farcaster_predictions', COUNT(*) FROM zkastro.farcaster_predictions
UNION ALL
SELECT 'farcaster_ratings', COUNT(*) FROM zkastro.farcaster_ratings
UNION ALL
SELECT 'prediction_requests', COUNT(*) FROM zkastro.prediction_requests
UNION ALL
SELECT 'prediction_answers', COUNT(*) FROM zkastro.prediction_answers
UNION ALL
SELECT 'chat_messages', COUNT(*) FROM zkastro.chat_messages
UNION ALL
SELECT 'reputation_events', COUNT(*) FROM zkastro.reputation_events
UNION ALL
SELECT 'sessions', COUNT(*) FROM zkastro.sessions
ORDER BY table_name;

-- View sample data
SELECT id, email, first_name, last_name, reputation, created_at 
FROM zkastro.users 
ORDER BY reputation DESC;

SELECT id, handle, method, reputation, personality 
FROM zkastro.agents 
ORDER BY reputation DESC;

SELECT user_id, location, dob, tob 
FROM zkastro.farcaster_users;

SELECT user_id, date, prediction, lucky_number, lucky_color, mood 
FROM zkastro.farcaster_predictions 
ORDER BY date DESC;


