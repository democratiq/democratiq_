-- Politician Onboarding Database Schema
-- Run this in your Supabase SQL editor

-- 1. Create politicians table
CREATE TABLE IF NOT EXISTS politicians (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  party TEXT,
  constituency TEXT,
  position TEXT,
  state TEXT,
  district TEXT,
  profile_image TEXT,
  bio TEXT,
  social_media JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{
    "task_auto_assign": true,
    "email_notifications": true,
    "sms_notifications": false,
    "whatsapp_notifications": true
  }',
  subscription_tier TEXT DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'pro', 'enterprise')),
  subscription_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'staff')),
  politician_id UUID REFERENCES politicians(id) ON DELETE CASCADE,
  permissions TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create task counters table for analytics
CREATE TABLE IF NOT EXISTS task_counters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  politician_id UUID NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
  total_tasks INTEGER DEFAULT 0,
  open_tasks INTEGER DEFAULT 0,
  in_progress_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  closed_tasks INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(politician_id)
);

-- 4. Create categories table if it doesn't exist, or update if it does
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'categories') THEN
        CREATE TABLE categories (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            value TEXT NOT NULL,
            label TEXT NOT NULL,
            subcategories TEXT[] DEFAULT '{}',
            politician_id UUID REFERENCES politicians(id) ON DELETE CASCADE,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    ELSE
        ALTER TABLE categories 
        ADD COLUMN IF NOT EXISTS politician_id UUID REFERENCES politicians(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 5. Update tasks table to include politician_id
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS politician_id UUID REFERENCES politicians(id) ON DELETE CASCADE;

-- 6. Create staff table if it doesn't exist, or update if it does
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'staff') THEN
        CREATE TABLE staff (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            phone TEXT,
            role TEXT CHECK (role IN ('admin', 'agent', 'supervisor')),
            location TEXT,
            politician_id UUID REFERENCES politicians(id) ON DELETE CASCADE,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    ELSE
        ALTER TABLE staff 
        ADD COLUMN IF NOT EXISTS politician_id UUID REFERENCES politicians(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 7. Create workflows table if it doesn't exist, or update if it does
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'workflows') THEN
        CREATE TABLE workflows (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            category_id UUID,
            subcategory TEXT,
            sla_days INTEGER DEFAULT 7,
            sla_hours INTEGER DEFAULT 0,
            politician_id UUID REFERENCES politicians(id) ON DELETE CASCADE,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    ELSE
        ALTER TABLE workflows 
        ADD COLUMN IF NOT EXISTS politician_id UUID REFERENCES politicians(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_politicians_email ON politicians(email);
CREATE INDEX IF NOT EXISTS idx_politicians_is_active ON politicians(is_active);
CREATE INDEX IF NOT EXISTS idx_user_profiles_politician_id ON user_profiles(politician_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_tasks_politician_id ON tasks(politician_id);
CREATE INDEX IF NOT EXISTS idx_categories_politician_id ON categories(politician_id);
CREATE INDEX IF NOT EXISTS idx_staff_politician_id ON staff(politician_id);
CREATE INDEX IF NOT EXISTS idx_workflows_politician_id ON workflows(politician_id);

-- 9. Create RLS policies

-- Enable RLS on all tables
ALTER TABLE politicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_counters ENABLE ROW LEVEL SECURITY;

-- Politicians table policies
CREATE POLICY "Super admins can view all politicians" ON politicians
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can create politicians" ON politicians
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can update politicians" ON politicians
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Users can view their own politician" ON politicians
  FOR SELECT
  USING (
    id IN (
      SELECT politician_id FROM user_profiles
      WHERE user_profiles.id = auth.uid()
    )
  );

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Super admins can view all profiles" ON user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role = 'super_admin'
    )
  );

CREATE POLICY "Admins can view profiles in their organization" ON user_profiles
  FOR SELECT
  USING (
    politician_id IN (
      SELECT politician_id FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Task counters policies
CREATE POLICY "Users can view their organization's counters" ON task_counters
  FOR SELECT
  USING (
    politician_id IN (
      SELECT politician_id FROM user_profiles
      WHERE id = auth.uid()
    )
  );

-- Update existing tables RLS policies to include politician_id checks
DO $$
BEGIN
  -- Enable RLS on existing tables if they exist
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tasks') THEN
    ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policy if it exists
    DROP POLICY IF EXISTS "Users can only see their organization's tasks" ON tasks;
    
    -- Create new policy
    CREATE POLICY "Users can only see their organization's tasks" ON tasks
      FOR SELECT
      USING (
        politician_id IN (
          SELECT politician_id FROM user_profiles
          WHERE id = auth.uid()
        )
        OR
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id = auth.uid()
          AND role = 'super_admin'
        )
      );
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'categories') THEN
    ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policy if it exists
    DROP POLICY IF EXISTS "Users can only see their organization's categories" ON categories;
    
    -- Create new policy
    CREATE POLICY "Users can only see their organization's categories" ON categories
      FOR SELECT
      USING (
        politician_id IN (
          SELECT politician_id FROM user_profiles
          WHERE id = auth.uid()
        )
        OR
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id = auth.uid()
          AND role = 'super_admin'
        )
      );
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'staff') THEN
    ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policy if it exists
    DROP POLICY IF EXISTS "Users can only see their organization's staff" ON staff;
    
    -- Create new policy
    CREATE POLICY "Users can only see their organization's staff" ON staff
      FOR SELECT
      USING (
        politician_id IN (
          SELECT politician_id FROM user_profiles
          WHERE id = auth.uid()
        )
        OR
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id = auth.uid()
          AND role = 'super_admin'
        )
      );
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'workflows') THEN
    ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policy if it exists
    DROP POLICY IF EXISTS "Users can only see their organization's workflows" ON workflows;
    
    -- Create new policy
    CREATE POLICY "Users can only see their organization's workflows" ON workflows
      FOR SELECT
      USING (
        politician_id IN (
          SELECT politician_id FROM user_profiles
          WHERE id = auth.uid()
        )
        OR
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id = auth.uid()
          AND role = 'super_admin'
        )
      );
  END IF;
END $$;

-- 10. Create trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_politicians_updated_at BEFORE UPDATE ON politicians
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. Insert a super admin user (replace with your actual user ID and details)
-- This should be run after you've created your first auth user
/*
INSERT INTO user_profiles (id, email, name, role, is_active)
VALUES (
  'YOUR-AUTH-USER-ID-HERE',
  'superadmin@example.com',
  'Super Admin',
  'super_admin',
  true
)
ON CONFLICT (id) DO UPDATE
SET role = 'super_admin';
*/

-- 12. Sample data for testing (optional - remove in production)
/*
-- Create a test politician
INSERT INTO politicians (name, email, phone, party, position, subscription_tier)
VALUES ('Test Politician', 'test@politician.com', '+91 9876543210', 'Test Party', 'MLA', 'pro');

-- Create task counter for the politician
INSERT INTO task_counters (politician_id)
SELECT id FROM politicians WHERE email = 'test@politician.com';
*/