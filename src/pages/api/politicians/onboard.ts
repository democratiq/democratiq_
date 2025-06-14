import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { verifyApiKeyOrSuperAdmin } from '../../../lib/server-auth'
import bcrypt from 'bcryptjs'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('=== POLITICIAN ONBOARDING API CALLED ===')
  console.log('Method:', req.method)
  
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST'])
      res.status(405).json({ error: `Method ${req.method} Not Allowed` })
      return
    }

    // Verify super admin access
    const authResult = await verifyApiKeyOrSuperAdmin(req)
    if (!authResult.isValid) {
      console.log('Authentication failed:', authResult.error)
      res.status(403).json({ 
        error: 'Forbidden', 
        message: authResult.error 
      })
      return
    }

    console.log('Super admin authenticated successfully')

    const { politician, admin_user } = req.body

    // Validate required fields
    if (!politician?.name || !politician?.email || !politician?.phone) {
      return res.status(400).json({
        error: 'Missing required politician fields',
        required: ['name', 'email', 'phone']
      })
    }

    if (!admin_user?.name || !admin_user?.email || !admin_user?.password) {
      return res.status(400).json({
        error: 'Missing required admin user fields',
        required: ['name', 'email', 'password']
      })
    }

    // Start transaction-like operations
    console.log('Creating politician record...')

    // 1. Create politician record
    const { data: newPolitician, error: politicianError } = await supabaseAdmin
      .from('politicians')
      .insert({
        name: politician.name,
        email: politician.email,
        phone: politician.phone,
        party: politician.party || null,
        constituency: politician.constituency || null,
        position: politician.position || null,
        state: politician.state || null,
        district: politician.district || null,
        profile_image: politician.profile_image || null,
        bio: politician.bio || null,
        social_media: politician.social_media || {},
        settings: politician.settings || {
          task_auto_assign: true,
          email_notifications: true,
          sms_notifications: false,
          whatsapp_notifications: true
        },
        subscription_tier: politician.subscription_tier || 'basic',
        subscription_expires_at: calculateSubscriptionExpiry(politician.subscription_months || 12),
        is_active: true,
        created_by: authResult.userId || 'super_admin'
      })
      .select()
      .single()

    if (politicianError) {
      console.error('Error creating politician:', politicianError)
      return res.status(500).json({
        error: 'Failed to create politician',
        details: politicianError.message
      })
    }

    console.log('Politician created:', newPolitician.id)

    // 2. Create auth user for admin
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: admin_user.email,
      password: admin_user.password,
      email_confirm: true,
      user_metadata: {
        name: admin_user.name,
        phone: admin_user.phone,
        politician_id: newPolitician.id
      }
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      // Rollback politician creation
      await supabaseAdmin
        .from('politicians')
        .delete()
        .eq('id', newPolitician.id)
      
      return res.status(500).json({
        error: 'Failed to create admin user',
        details: authError.message
      })
    }

    console.log('Auth user created:', authUser.user.id)

    // 3. Create user profile
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: authUser.user.id,
        email: admin_user.email,
        name: admin_user.name,
        phone: admin_user.phone,
        role: 'admin',
        politician_id: newPolitician.id,
        permissions: ['tasks.create', 'tasks.read', 'tasks.update', 'tasks.delete', 'staff.manage'],
        is_active: true
      })

    if (profileError) {
      console.error('Error creating user profile:', profileError)
      // Rollback auth user and politician
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      await supabaseAdmin
        .from('politicians')
        .delete()
        .eq('id', newPolitician.id)
      
      return res.status(500).json({
        error: 'Failed to create user profile',
        details: profileError.message
      })
    }

    console.log('User profile created')

    // 4. Create default categories for this politician
    const defaultCategories = [
      { value: 'general', label: 'General Complaint', subcategories: ['Information Request', 'Complaint', 'Suggestion', 'Feedback'] },
      { value: 'infrastructure', label: 'Infrastructure', subcategories: ['Road Related', 'Bridge', 'Building', 'Other Infrastructure'] },
      { value: 'water', label: 'Water Supply', subcategories: ['Pipe Leak', 'No Water Supply', 'Poor Water Quality', 'Billing Issues'] },
      { value: 'electricity', label: 'Electricity', subcategories: ['Power Outage', 'Street Light', 'Meter Issues', 'High Bills'] },
      { value: 'sanitation', label: 'Sanitation', subcategories: ['Garbage Collection', 'Drain Cleaning', 'Public Toilets', 'Pest Control'] }
    ]

    for (const category of defaultCategories) {
      await supabaseAdmin
        .from('categories')
        .insert({
          politician_id: newPolitician.id,
          value: category.value,
          label: category.label,
          subcategories: category.subcategories,
          is_active: true
        })
    }

    console.log('Default categories created')

    // 5. Initialize task counters for this politician
    await supabaseAdmin
      .from('task_counters')
      .insert({
        politician_id: newPolitician.id,
        total_tasks: 0,
        open_tasks: 0,
        in_progress_tasks: 0,
        completed_tasks: 0,
        closed_tasks: 0
      })

    console.log('Task counters initialized')

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Politician onboarded successfully',
      data: {
        politician: {
          id: newPolitician.id,
          name: newPolitician.name,
          email: newPolitician.email,
          subscription_tier: newPolitician.subscription_tier,
          subscription_expires_at: newPolitician.subscription_expires_at
        },
        admin_user: {
          id: authUser.user.id,
          email: authUser.user.email,
          name: admin_user.name
        }
      }
    })

  } catch (error) {
    console.error('=== POLITICIAN ONBOARDING ERROR ===')
    console.error('Error:', error)
    
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error)
    })
  }
}

function calculateSubscriptionExpiry(months: number): string {
  const expiryDate = new Date()
  expiryDate.setMonth(expiryDate.getMonth() + months)
  return expiryDate.toISOString()
}