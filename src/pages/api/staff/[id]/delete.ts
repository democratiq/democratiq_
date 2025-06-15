import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { getAuthContext, applyPoliticianFilter } from '@/lib/api-auth-helpers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
    // Get auth context
    const authContext = await getAuthContext(req)
    
    if (!authContext) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { id } = req.query
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Staff ID is required' })
    }

    // First verify the staff member exists and user has access
    let verifyQuery = supabase
      .from('staff')
      .select('id, politician_id')
      .eq('id', id)

    // Apply politician filter if user is not super admin
    verifyQuery = applyPoliticianFilter(verifyQuery, authContext)

    const { data: existingStaff, error: verifyError } = await verifyQuery.single()

    if (verifyError || !existingStaff) {
      console.error('Staff not found or access denied:', verifyError)
      return res.status(404).json({ error: 'Staff member not found or access denied' })
    }

    // Instead of hard delete, we'll soft delete by setting is_active to false
    let updateQuery = supabase
      .from('staff')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    // Apply politician filter if user is not super admin
    updateQuery = applyPoliticianFilter(updateQuery, authContext)

    const { data: updatedStaff, error } = await updateQuery
      .select('*')
      .single()

    if (error) {
      console.error('Error deactivating staff member:', error)
      return res.status(500).json({ error: 'Failed to deactivate staff member' })
    }

    res.status(200).json({ 
      message: 'Staff member deactivated successfully',
      staff: updatedStaff
    })

  } catch (error) {
    console.error('Error deleting staff member:', error)
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}