-- ============================================
-- Quick Verification Queries
-- Run these to check if everything is working
-- ============================================

-- 1. List all tables in zkastro schema
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'zkastro' 
ORDER BY tablename;

-- 2. Count rows in all tables
SELECT 
    'users' as table_name, 
    COUNT(*) as row_count 
FROM zkastro.users
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

-- 3. View all users
SELECT * FROM zkastro.users ORDER BY reputation DESC;

-- 4. View all agents
SELECT * FROM zkastro.agents ORDER BY reputation DESC;

-- 5. View all Farcaster users
SELECT * FROM zkastro.farcaster_users;

-- 6. View all predictions
SELECT * FROM zkastro.farcaster_predictions ORDER BY date DESC;

-- 7. View all ratings
SELECT * FROM zkastro.farcaster_ratings ORDER BY date DESC;


