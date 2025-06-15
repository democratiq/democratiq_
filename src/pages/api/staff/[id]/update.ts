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
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT'])
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

    const {
      name,
      email,
      phone,
      role,
      department,
      location,
      is_active
    } = req.body

    // Validate role if provided
    if (role && !['admin', 'agent', 'supervisor'].includes(role)) {
      return res.status(400).json({
        error: 'Invalid role. Must be admin, agent, or supervisor'
      })
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

    // Prepare update data (only include provided fields)
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (role !== undefined) updateData.role = role
    if (department !== undefined) updateData.department = department
    if (location !== undefined) updateData.location = location
    if (is_active !== undefined) updateData.is_active = is_active

    // Update the staff member
    let updateQuery = supabase
      .from('staff')
      .update(updateData)
      .eq('id', id)

    // Apply politician filter if user is not super admin
    updateQuery = applyPoliticianFilter(updateQuery, authContext)

    const { data: updatedStaff, error } = await updateQuery
      .select('*')
      .single()

    if (error) {
      console.error('Error updating staff member:', error)
      return res.status(500).json({ error: 'Failed to update staff member' })
    }

    res.status(200).json(updatedStaff)

  } catch (error) {
    console.error('Error updating staff member:', error)
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}