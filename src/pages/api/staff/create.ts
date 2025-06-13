import { NextApiRequest, NextApiResponse } from 'next'
import { staffService } from '@/lib/supabase-admin'
import { Staff } from '@/lib/database-types'

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
    const {
      name,
      email,
      phone,
      role,
      location
    } = req.body

    // Validate required fields
    if (!name || !email || !phone || !role) {
      return res.status(400).json({
        error: 'Missing required fields: name, email, phone, role'
      })
    }

    // Validate role
    if (!['admin', 'agent', 'supervisor'].includes(role)) {
      return res.status(400).json({
        error: 'Invalid role. Must be admin, agent, or supervisor'
      })
    }

    // Create staff member
    const staffData: Omit<Staff, 'id' | 'created_at' | 'updated_at'> = {
      name,
      email,
      phone,
      role,
      location,
      performance: {
        points: 0,
        tasks_completed: 0,
        avg_completion_time: 0,
        badges: []
      },
      task_type_history: {},
      is_active: true
    }

    const staff = await staffService.create(staffData)

    res.status(201).json(staff)

  } catch (error) {
    console.error('Error creating staff member:', error)
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}