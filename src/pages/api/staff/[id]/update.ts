import { NextApiRequest, NextApiResponse } from 'next'
import { staffService } from '@/lib/supabase-admin'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
    return
  }

  try {
    const { id } = req.query
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Staff ID is required' })
    }

    const {
      name,
      email,
      phone,
      role,
      location,
      is_active
    } = req.body

    // Validate role if provided
    if (role && !['admin', 'agent', 'supervisor'].includes(role)) {
      return res.status(400).json({
        error: 'Invalid role. Must be admin, agent, or supervisor'
      })
    }

    // Get current staff data
    const currentStaff = await staffService.getById(id)
    
    // Prepare update data (only include provided fields)
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (role !== undefined) updateData.role = role
    if (location !== undefined) updateData.location = location
    if (is_active !== undefined) updateData.is_active = is_active

    const updatedStaff = await staffService.update(id, updateData)

    res.status(200).json(updatedStaff)

  } catch (error) {
    console.error('Error updating staff member:', error)
    
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ error: 'Staff member not found' })
    } else {
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}