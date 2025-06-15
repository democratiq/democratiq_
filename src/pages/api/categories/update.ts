import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

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
    // Get auth context to determine politician_id
    const { getAuthContext } = await import('../../../lib/api-auth-helpers')
    const authContext = await getAuthContext(req)
    
    if (!authContext) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { id } = req.query
    const { value, label, subcategories } = req.body

    if (!id) {
      return res.status(400).json({
        error: 'Category ID is required'
      })
    }

    // Validate required fields
    if (!value || !label) {
      return res.status(400).json({
        error: 'Missing required fields: value and label are required'
      })
    }

    // Validate value format (should be lowercase, no spaces)
    if (!/^[a-z][a-z0-9_]*$/.test(value)) {
      return res.status(400).json({
        error: 'Category value must be lowercase alphanumeric with underscores only, starting with a letter'
      })
    }

    // Update in Supabase with politician_id filter for security
    let updateQuery = supabase
      .from('categories')
      .update({
        value,
        label,
        subcategories: subcategories || []
      })
      .eq('id', id)

    // Apply politician filter if user is not super admin
    if (authContext.role !== 'super_admin' && authContext.politicianId) {
      updateQuery = updateQuery.eq('politician_id', authContext.politicianId)
    }

    const { data: updatedCategory, error } = await updateQuery
      .select()
      .single()

    if (error) {
      console.error('Error updating category:', error)
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({
          error: 'A category with this value already exists'
        })
      }
      return res.status(500).json({ error: 'Failed to update category' })
    }

    if (!updatedCategory) {
      return res.status(404).json({ error: 'Category not found' })
    }

    console.log('Updated category:', updatedCategory)
    res.status(200).json(updatedCategory)

  } catch (error) {
    console.error('Error updating category:', error)
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}