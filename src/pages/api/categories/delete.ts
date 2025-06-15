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
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE'])
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

    if (!id) {
      return res.status(400).json({
        error: 'Category ID is required'
      })
    }

    // Check if any tasks are using this category (within the user's politician scope)
    let tasksQuery = supabase
      .from('tasks')
      .select('id')
      .eq('category', id)

    // Apply politician filter if user is not super admin
    if (authContext.role !== 'super_admin' && authContext.politicianId) {
      tasksQuery = tasksQuery.eq('politician_id', authContext.politicianId)
    }

    const { data: tasks, error: tasksError } = await tasksQuery.limit(1)

    if (tasksError) {
      console.error('Error checking tasks:', tasksError)
      return res.status(500).json({ error: 'Failed to check category usage' })
    }

    if (tasks && tasks.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete category that is being used by existing tasks'
      })
    }

    // Delete from Supabase with politician_id filter for security
    let deleteQuery = supabase
      .from('categories')
      .delete()
      .eq('id', id)

    // Apply politician filter if user is not super admin
    if (authContext.role !== 'super_admin' && authContext.politicianId) {
      deleteQuery = deleteQuery.eq('politician_id', authContext.politicianId)
    }

    const { error } = await deleteQuery

    if (error) {
      console.error('Error deleting category:', error)
      return res.status(500).json({ error: 'Failed to delete category' })
    }
    
    console.log('Deleted category:', id)
    res.status(200).json({ 
      message: 'Category deleted successfully',
      id: id 
    })

  } catch (error) {
    console.error('Error deleting category:', error)
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}