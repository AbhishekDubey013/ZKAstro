-- Migration: Add correct_answer_id to prediction_requests
-- This allows tracking the verified correct prediction separately from initial selection

ALTER TABLE "zkastro"."prediction_requests" ADD COLUMN "correct_answer_id" varchar;




