-- Migration script for Categories and Workflows tables
-- This script creates the required tables for managing categories, workflows, and workflow steps

-- 1. Categories table with subcategories as array
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  value TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  subcategories TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Workflows table with foreign key to categories
CREATE TABLE IF NOT EXISTS workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  subcategory TEXT DEFAULT 'all',
  sla_days INTEGER NOT NULL,
  sla_hours INTEGER DEFAULT 0,
  warning_threshold INTEGER DEFAULT 80,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Workflow steps as separate normalized table
CREATE TABLE IF NOT EXISTS workflow_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  duration INTEGER DEFAULT 0, -- in hours
  required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Add workflow_id to existing tasks table for workflow-task relationship
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS workflow_id UUID REFERENCES workflows(id);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workflows_category_id ON workflows(category_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow_id ON workflow_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_tasks_workflow_id ON tasks(workflow_id);
CREATE INDEX IF NOT EXISTS idx_categories_value ON categories(value);

-- 6. Add updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workflows_updated_at ON workflows;
CREATE TRIGGER update_workflows_updated_at
  BEFORE UPDATE ON workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workflow_steps_updated_at ON workflow_steps;
CREATE TRIGGER update_workflow_steps_updated_at
  BEFORE UPDATE ON workflow_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_steps_updated_at_column();

-- 8. Insert default categories (migrate from localStorage structure)
INSERT INTO categories (value, label, subcategories) VALUES
('general', 'General Complaint', ARRAY['Information Request', 'Complaint', 'Suggestion', 'Feedback']),
('water', 'Water Supply', ARRAY['Pipe Leak', 'No Water Supply', 'Poor Water Quality', 'Billing Issues']),
('electricity', 'Electricity', ARRAY['Power Outage', 'Street Light', 'Meter Issues', 'High Bills']),
('roads', 'Roads & Infrastructure', ARRAY['Potholes', 'Road Construction', 'Traffic Issues', 'Signage']),
('sanitation', 'Sanitation', ARRAY['Garbage Collection', 'Drain Cleaning', 'Public Toilets', 'Pest Control'])
ON CONFLICT (value) DO NOTHING;

-- 9. Enable Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies (allow all for authenticated users, modify as needed)
CREATE POLICY "Allow all operations for authenticated users" ON categories
  FOR ALL USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON workflows
  FOR ALL USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON workflow_steps
  FOR ALL USING (true);

-- Migration complete
-- Next steps:
-- 1. Run this script in Supabase SQL Editor
-- 2. Create API endpoints for categories and workflows
-- 3. Update configuration page to use Supabase instead of localStorage