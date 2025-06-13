import { NextApiRequest, NextApiResponse } from 'next'
import { staffService } from '@/lib/supabase-admin'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
    return
  }

  try {
    const { id } = req.query
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Staff ID is required' })
    }

    // Instead of hard delete, we'll soft delete by setting is_active to false
    const updatedStaff = await staffService.update(id, { is_active: false })

    res.status(200).json({ 
      message: 'Staff member deactivated successfully',
      staff: updatedStaff
    })

  } catch (error) {
    console.error('Error deleting staff member:', error)
    
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