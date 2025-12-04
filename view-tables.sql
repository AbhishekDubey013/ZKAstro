-- ============================================
-- Simple queries to view your data
-- Copy and paste any of these into Neon SQL Editor
-- ============================================

-- View all users
SELECT * FROM zkastro.users;

-- View all agents
SELECT * FROM zkastro.agents;

-- View all Farcaster users
SELECT * FROM zkastro.farcaster_users;

-- View today's predictions
SELECT * FROM zkastro.farcaster_predictions WHERE date = '2025-10-27';

-- View all predictions
SELECT * FROM zkastro.farcaster_predictions;

-- View all ratings
SELECT * FROM zkastro.farcaster_ratings;

-- Get user with their predictions
SELECT 
    fu.user_id,
    fu.location,
    fp.date,
    fp.prediction,
    fp.lucky_number,
    fp.lucky_color,
    fp.mood
FROM zkastro.farcaster_users fu
LEFT JOIN zkastro.farcaster_predictions fp ON fu.user_id = fp.user_id
ORDER BY fp.date DESC;

-- Get predictions with ratings
SELECT 
    fp.user_id,
    fp.date,
    fp.prediction,
    fp.mood,
    fr.rating
FROM zkastro.farcaster_predictions fp
LEFT JOIN zkastro.farcaster_ratings fr ON fp.user_id = fr.user_id AND fp.date = fr.date
ORDER BY fp.date DESC;

