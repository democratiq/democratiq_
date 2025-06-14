-- Complete fix for workflow_steps table structure
-- Run this in Supabase SQL Editor

-- First, let's see the current structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'workflow_steps' 
ORDER BY ordinal_position;

-- Add missing columns
ALTER TABLE workflow_steps ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 0;
ALTER TABLE workflow_steps ADD COLUMN IF NOT EXISTS required BOOLEAN DEFAULT true;

-- Verify the updated structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'workflow_steps' 
ORDER BY ordinal_position;