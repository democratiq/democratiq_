-- Migration script for Task Workflow Steps
-- This table tracks the workflow steps attached to each task and their completion status

-- 1. Create task_workflow_steps table to track workflow step completion per task
CREATE TABLE IF NOT EXISTS task_workflow_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  workflow_step_id UUID NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  duration INTEGER DEFAULT 0,
  required BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  completed_at TIMESTAMPTZ,
  completed_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_workflow_steps_task_id ON task_workflow_steps(task_id);
CREATE INDEX IF NOT EXISTS idx_task_workflow_steps_workflow_step_id ON task_workflow_steps(workflow_step_id);
CREATE INDEX IF NOT EXISTS idx_task_workflow_steps_status ON task_workflow_steps(status);

-- 3. Add trigger for updated_at
DROP TRIGGER IF EXISTS update_task_workflow_steps_updated_at ON task_workflow_steps;
CREATE TRIGGER update_task_workflow_steps_updated_at
  BEFORE UPDATE ON task_workflow_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Enable RLS
ALTER TABLE task_workflow_steps ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies
CREATE POLICY "Allow all operations for authenticated users" ON task_workflow_steps
  FOR ALL USING (true);

-- 6. Create a function to calculate task progress based on completed steps
CREATE OR REPLACE FUNCTION calculate_task_progress(p_task_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
  total_steps INTEGER;
  completed_steps INTEGER;
  progress INTEGER;
BEGIN
  -- Count total steps for the task
  SELECT COUNT(*) INTO total_steps
  FROM task_workflow_steps
  WHERE task_id = p_task_id;
  
  -- If no steps, return current progress
  IF total_steps = 0 THEN
    SELECT COALESCE(progress, 0) INTO progress
    FROM tasks
    WHERE id = p_task_id;
    RETURN progress;
  END IF;
  
  -- Count completed steps
  SELECT COUNT(*) INTO completed_steps
  FROM task_workflow_steps
  WHERE task_id = p_task_id
  AND status = 'completed';
  
  -- Calculate percentage
  progress := ROUND((completed_steps::FLOAT / total_steps::FLOAT) * 100);
  
  RETURN progress;
END;
$$ LANGUAGE plpgsql;

-- 7. Create a trigger to update task progress when step status changes
CREATE OR REPLACE FUNCTION update_task_progress_on_step_change()
RETURNS TRIGGER AS $$
DECLARE
  new_progress INTEGER;
BEGIN
  -- Calculate new progress
  new_progress := calculate_task_progress(NEW.task_id);
  
  -- Update task progress
  UPDATE tasks 
  SET progress = new_progress,
      updated_at = NOW()
  WHERE id = NEW.task_id;
  
  -- If all required steps are completed, update task status
  IF NOT EXISTS (
    SELECT 1 
    FROM task_workflow_steps 
    WHERE task_id = NEW.task_id 
    AND required = true 
    AND status != 'completed'
  ) THEN
    UPDATE tasks 
    SET status = 'completed',
        updated_at = NOW()
    WHERE id = NEW.task_id
    AND status != 'completed';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger for automatic progress update
DROP TRIGGER IF EXISTS update_task_progress_on_step_change_trigger ON task_workflow_steps;
CREATE TRIGGER update_task_progress_on_step_change_trigger
  AFTER INSERT OR UPDATE OF status ON task_workflow_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_task_progress_on_step_change();