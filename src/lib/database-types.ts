export interface Task {
  id: number
  title: string
  category: string
  sub_category?: string
  status: 'open' | 'in_progress' | 'completed' | 'closed'
  priority: 'low' | 'medium' | 'high'
  progress: number
  filled_by: string
  assigned_to?: string
  deadline?: string
  is_deleted: boolean
  ai_summary?: string
  created_at: string
  workflow_id?: string
  source?: 'voice_bot' | 'whatsapp' | 'manual_entry' | 'qr_code' | 'email'
}

export interface TaskWithSLA extends Task {
  sla_status: 'within_sla' | 'approaching_sla' | 'overdue'
  days_remaining?: number
  hours_remaining?: number
  totalSteps?: number
  completedSteps?: number
}

export interface Staff {
  id: string
  name: string
  email: string
  phone: string
  role: 'admin' | 'agent' | 'supervisor'
  location?: string
  performance: {
    points: number
    tasks_completed: number
    avg_completion_time: number
    badges: ('bronze' | 'silver' | 'gold')[]
  }
  task_type_history: Record<string, number>
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SOP {
  id: string
  title: string
  task_type: string
  description: string
  steps: SOPStep[]
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface SOPStep {
  id: string
  step_number: number
  title: string
  description: string
  is_required: boolean
  estimated_time_minutes: number
  is_completed?: boolean
  completed_by?: string
  completed_at?: string
  notes?: string
}

export interface TrainingModule {
  id: string
  title: string
  description: string
  category: string
  content_url: string
  duration_minutes: number
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  is_active: boolean
  created_at: string
}

export interface Politician {
  id: string
  name: string
  email: string
  phone: string
  party?: string
  constituency?: string
  position?: string
  state?: string
  district?: string
  profile_image?: string
  bio?: string
  social_media?: {
    twitter?: string
    facebook?: string
    instagram?: string
    linkedin?: string
  }
  settings?: {
    task_auto_assign?: boolean
    email_notifications?: boolean
    sms_notifications?: boolean
    whatsapp_notifications?: boolean
  }
  subscription_tier?: 'basic' | 'pro' | 'enterprise'
  subscription_expires_at?: string
  is_active: boolean
  created_at: string
  created_by: string
  updated_at: string
}

export interface UserProfile {
  id: string
  email: string
  role: 'super_admin' | 'admin' | 'staff'
  politician_id?: string
  name?: string
  phone?: string
  permissions?: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}