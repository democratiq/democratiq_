import { createClient } from '@supabase/supabase-js'
import { Task, Staff, SOP, TrainingModule } from './database-types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Task operations
export const taskService = {
  async create(task: Omit<Task, 'id' | 'created_at'>) {
    console.log('Creating task in Supabase with data:', task)
    
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .insert([task])
      .select()
      .single()
    
    if (error) {
      console.error('Supabase insert error:', error)
      throw error
    }
    
    console.log('Task created successfully:', data)
    return data
  },

  async getById(id: number) {
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async getAll(filters?: { status?: string; category?: string }) {
    let query = supabaseAdmin.from('tasks').select('*').eq('is_deleted', false)
    
    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.category) query = query.eq('category', filters.category)
    
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async update(id: number, updates: Partial<Task>) {
    console.log('Supabase update called with:', { id, updates })
    
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Supabase update error:', error)
      throw error
    }
    
    console.log('Supabase update successful:', data)
    return data
  },

  async delete(id: number) {
    const { error } = await supabaseAdmin
      .from('tasks')
      .update({ is_deleted: true })
      .eq('id', id)
    
    if (error) throw error
  }
}

// Staff operations
export const staffService = {
  async create(staff: Omit<Staff, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabaseAdmin
      .from('staff')
      .insert([{
        ...staff,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('staff')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async getAll() {
    const { data, error } = await supabaseAdmin
      .from('staff')
      .select('*')
      .eq('is_active', true)
      .order('performance->points', { ascending: false })
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<Staff>) {
    const { data, error } = await supabaseAdmin
      .from('staff')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updatePoints(staffId: string, pointsToAdd: number) {
    const staff = await this.getById(staffId)
    const newPoints = staff.performance.points + pointsToAdd
    
    return this.update(staffId, {
      performance: {
        ...staff.performance,
        points: newPoints,
        tasks_completed: staff.performance.tasks_completed + 1
      }
    })
  }
}

// SOP operations
export const sopService = {
  async create(sop: Omit<SOP, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabaseAdmin
      .from('sops')
      .insert([{
        ...sop,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getByTaskType(taskType: string) {
    const { data, error } = await supabaseAdmin
      .from('sops')
      .select('*')
      .eq('task_type', taskType)
      .eq('is_active', true)
      .single()
    
    if (error) return null
    return data
  },

  async getAll() {
    const { data, error } = await supabaseAdmin
      .from('sops')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }
}