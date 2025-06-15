-- Calendar and Events Management Migration
-- Run this script in your Supabase SQL editor

-- 1. Events table
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'town_hall', 'press_conference', 'community_event', 'rally', 
        'meeting', 'debate', 'interview', 'fundraiser', 'workshop', 'emergency_meeting'
    )),
    date DATE NOT NULL,
    time TIME NOT NULL,
    duration INTEGER DEFAULT 60, -- minutes
    location TEXT NOT NULL,
    expected_attendees INTEGER,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    approval_stage VARCHAR(50) DEFAULT 'event_manager',
    requires_approval BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT true,
    allow_media_coverage BOOLEAN DEFAULT false,
    tags TEXT[],
    organizer VARCHAR(255),
    budget DECIMAL(10,2),
    notes TEXT,
    ai_priority_score DECIMAL(3,1),
    created_by UUID NOT NULL,
    politician_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_events_politician FOREIGN KEY (politician_id) REFERENCES politicians(id) ON DELETE CASCADE
);

-- 2. Event Approvals table (for multi-level approval workflows)
CREATE TABLE IF NOT EXISTS event_approvals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL,
    approval_level INTEGER NOT NULL,
    approver_role VARCHAR(50) NOT NULL CHECK (approver_role IN (
        'event_manager', 'campaign_director', 'chief_of_staff'
    )),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    comments TEXT,
    required BOOLEAN DEFAULT true,
    politician_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_event_approvals_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_event_approvals_politician FOREIGN KEY (politician_id) REFERENCES politicians(id) ON DELETE CASCADE,
    UNIQUE(event_id, approval_level)
);

-- 3. Calendar Integrations table
CREATE TABLE IF NOT EXISTS calendar_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    politician_id UUID NOT NULL,
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('google', 'outlook', 'apple')),
    status VARCHAR(20) DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
    email VARCHAR(255),
    access_token TEXT, -- Encrypted in production
    refresh_token TEXT, -- Encrypted in production
    token_expires_at TIMESTAMP WITH TIME ZONE,
    calendars_connected INTEGER DEFAULT 0,
    last_sync TIMESTAMP WITH TIME ZONE,
    sync_enabled BOOLEAN DEFAULT true,
    two_way_sync BOOLEAN DEFAULT true,
    conflict_detection BOOLEAN DEFAULT true,
    user_profile JSONB, -- Store user profile info from OAuth
    calendar_list JSONB, -- Store list of available calendars
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_calendar_integrations_politician FOREIGN KEY (politician_id) REFERENCES politicians(id) ON DELETE CASCADE,
    UNIQUE(politician_id, provider)
);

-- 4. Calendar Events table (for sync tracking)
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL,
    calendar_provider VARCHAR(20) NOT NULL,
    external_event_id VARCHAR(255), -- ID from external calendar
    sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'synced', 'failed')),
    sync_error TEXT,
    politician_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_calendar_events_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_calendar_events_politician FOREIGN KEY (politician_id) REFERENCES politicians(id) ON DELETE CASCADE
);

-- 5. Calendar Settings table
CREATE TABLE IF NOT EXISTS calendar_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    politician_id UUID NOT NULL,
    working_hours_start TIME DEFAULT '09:00',
    working_hours_end TIME DEFAULT '18:00',
    buffer_time INTEGER DEFAULT 30, -- minutes
    include_travel_time BOOLEAN DEFAULT true,
    auto_sync_enabled BOOLEAN DEFAULT true,
    sync_frequency INTEGER DEFAULT 60, -- minutes
    default_event_duration INTEGER DEFAULT 60, -- minutes
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_calendar_settings_politician FOREIGN KEY (politician_id) REFERENCES politicians(id) ON DELETE CASCADE,
    UNIQUE(politician_id)
);

-- 6. Notifications table (for approval notifications)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'event_approval', 'approval_required', 'calendar_sync', 'event_reminder'
    )),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    recipient_id UUID, -- Specific user
    recipient_role VARCHAR(50), -- Role-based notification
    related_id UUID, -- Related event/task ID
    politician_id UUID NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_notifications_politician FOREIGN KEY (politician_id) REFERENCES politicians(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_politician_date ON events(politician_id, date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_priority ON events(priority);

CREATE INDEX IF NOT EXISTS idx_event_approvals_event ON event_approvals(event_id);
CREATE INDEX IF NOT EXISTS idx_event_approvals_status ON event_approvals(status);

CREATE INDEX IF NOT EXISTS idx_calendar_integrations_politician ON calendar_integrations(politician_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_event ON calendar_events(event_id);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_politician ON notifications(politician_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(recipient_id) WHERE read_at IS NULL;

-- Enable Row Level Security (RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for multi-tenant isolation

-- Events policies
CREATE POLICY "Users can view events in their organization" ON events
    FOR SELECT USING (
        politician_id IN (
            SELECT p.id FROM politicians p
            JOIN user_profiles up ON up.politician_id = p.id
            WHERE up.id = auth.uid()
        )
    );

CREATE POLICY "Users can insert events in their organization" ON events
    FOR INSERT WITH CHECK (
        politician_id IN (
            SELECT p.id FROM politicians p
            JOIN user_profiles up ON up.politician_id = p.id
            WHERE up.id = auth.uid()
        )
    );

CREATE POLICY "Users can update events in their organization" ON events
    FOR UPDATE USING (
        politician_id IN (
            SELECT p.id FROM politicians p
            JOIN user_profiles up ON up.politician_id = p.id
            WHERE up.id = auth.uid()
        )
    );

-- Event Approvals policies
CREATE POLICY "Users can view approvals in their organization" ON event_approvals
    FOR SELECT USING (
        politician_id IN (
            SELECT p.id FROM politicians p
            JOIN user_profiles up ON up.politician_id = p.id
            WHERE up.id = auth.uid()
        )
    );

CREATE POLICY "Users can manage approvals in their organization" ON event_approvals
    FOR ALL USING (
        politician_id IN (
            SELECT p.id FROM politicians p
            JOIN user_profiles up ON up.politician_id = p.id
            WHERE up.id = auth.uid()
        )
    );

-- Calendar Integrations policies
CREATE POLICY "Users can manage calendar integrations in their organization" ON calendar_integrations
    FOR ALL USING (
        politician_id IN (
            SELECT p.id FROM politicians p
            JOIN user_profiles up ON up.politician_id = p.id
            WHERE up.id = auth.uid()
        )
    );

-- Calendar Events policies
CREATE POLICY "Users can manage calendar events in their organization" ON calendar_events
    FOR ALL USING (
        politician_id IN (
            SELECT p.id FROM politicians p
            JOIN user_profiles up ON up.politician_id = p.id
            WHERE up.id = auth.uid()
        )
    );

-- Calendar Settings policies
CREATE POLICY "Users can manage calendar settings in their organization" ON calendar_settings
    FOR ALL USING (
        politician_id IN (
            SELECT p.id FROM politicians p
            JOIN user_profiles up ON up.politician_id = p.id
            WHERE up.id = auth.uid()
        )
    );

-- Notifications policies
CREATE POLICY "Users can view their notifications" ON notifications
    FOR SELECT USING (
        recipient_id = auth.uid() OR 
        (recipient_role IS NOT NULL AND politician_id IN (
            SELECT p.id FROM politicians p
            JOIN user_profiles up ON up.politician_id = p.id
            WHERE up.id = auth.uid()
        ))
    );

CREATE POLICY "Users can update their notifications" ON notifications
    FOR UPDATE USING (recipient_id = auth.uid());

-- Insert default calendar settings for existing politicians
INSERT INTO calendar_settings (politician_id)
SELECT id FROM politicians
WHERE id NOT IN (SELECT politician_id FROM calendar_settings)
ON CONFLICT (politician_id) DO NOTHING;

-- Create sample approval workflows (optional)
-- These can be customized based on organization needs

COMMENT ON TABLE events IS 'Main events table with AI-powered scheduling and approval workflows';
COMMENT ON TABLE event_approvals IS 'Multi-level approval tracking for events';
COMMENT ON TABLE calendar_integrations IS 'External calendar provider integrations (Google, Outlook, etc.)';
COMMENT ON TABLE calendar_events IS 'Sync tracking between internal events and external calendars';
COMMENT ON TABLE calendar_settings IS 'Per-politician calendar preferences and AI optimization settings';
COMMENT ON TABLE notifications IS 'Event and approval notifications system';