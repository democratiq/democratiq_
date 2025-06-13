-- Add missing columns to the tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS assigned_to TEXT,
ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;