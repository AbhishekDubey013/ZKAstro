-- Migration: Add system_prompt column to agents table
-- This column stores the full LLM system prompt that shapes each agent's unique prediction behavior

ALTER TABLE "zkastro"."agents" ADD COLUMN IF NOT EXISTS "system_prompt" text;

