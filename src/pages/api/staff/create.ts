import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { getAuthContext } from '@/lib/api-auth-helpers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
    return
  }

  try {
    // Get auth context to determine politician_id
    const authContext = await getAuthContext(req)
    
    if (!authContext) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const {
      name,
      email,
      phone,
      role,
      department,
      location
    } = req.body

    // Validate required fields
    if (!name || !email || !phone || !role || !department) {
      return res.status(400).json({
        error: 'Missing required fields: name, email, phone, role, department'
      })
    }

    // Validate role
    if (!['admin', 'agent', 'supervisor'].includes(role)) {
      return res.status(400).json({
        error: 'Invalid role. Must be admin, agent, or supervisor'
      })
    }

    // Create staff member with politician_id
    const staffData = {
      name,
      email,
      phone,
      role,
      department,
      location: location || null,
      politician_id: authContext.politicianId,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: staff, error } = await supabase
      .from('staff')
      .insert(staffData)
      .select()
      .single()

    if (error) {
      console.error('Error creating staff member:', error)
      return res.status(500).json({ error: 'Failed to create staff member' })
    }

    res.status(201).json(staff)

  } catch (error) {
    console.error('Error creating staff member:', error)
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}