-- Add source column to tasks table
-- Run this in your Supabase SQL editor

-- Add the source column to tasks table using TEXT with check constraint
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual_entry';

-- Add check constraint to ensure only valid values
ALTER TABLE tasks 
ADD CONSTRAINT check_task_source 
CHECK (source IN ('voice_bot', 'whatsapp', 'manual_entry', 'qr_code', 'email'));

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_source ON tasks(source);

-- Update existing tasks to have manual_entry as default source
UPDATE tasks 
SET source = 'manual_entry' 
WHERE source IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN tasks.source IS 'Source of task creation: voice_bot, whatsapp, manual_entry, qr_code, email';

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' AND column_name = 'source';

-- Show sample of updated data
SELECT id, title, source, created_at 
FROM tasks 
ORDER BY created_at DESC 
LIMIT 5;