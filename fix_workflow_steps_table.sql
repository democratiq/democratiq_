-- Fix script to add missing duration column to workflow_steps table
-- Run this in Supabase SQL Editor if the duration column is missing

-- Check if duration column exists, if not add it
ALTER TABLE workflow_steps 
ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN workflow_steps.duration IS 'Expected duration for this step in hours';

-- Verify the table structure
-- Uncomment the line below to see the current table structure
-- SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'workflow_steps';