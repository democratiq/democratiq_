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
    // Get auth context to determine politician_id
    const authContext = await getAuthContext(req)
    
    if (!authContext) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { id } = req.query
    const updates = req.body

    console.log('Update API called with ID:', id, 'Updates:', updates)

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Task ID is required' })
    }

    const taskId = parseInt(id)
    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task ID' })
    }

    // Validate that we have some updates
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No updates provided' })
    }

    // First verify the task exists and user has access to it
    let verifyQuery = supabase
      .from('tasks')
      .select('id, politician_id')
      .eq('id', taskId)

    // Apply politician filter if user is not super admin
    verifyQuery = applyPoliticianFilter(verifyQuery, authContext)

    const { data: existingTask, error: verifyError } = await verifyQuery.single()

    if (verifyError || !existingTask) {
      console.error('Task not found or access denied:', verifyError)
      return res.status(404).json({ error: 'Task not found or access denied' })
    }

    // Update the task with politician_id filtering for security
    let updateQuery = supabase
      .from('tasks')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)

    // Apply politician filter if user is not super admin
    updateQuery = applyPoliticianFilter(updateQuery, authContext)

    const { data: updatedTask, error } = await updateQuery
      .select('*')
      .single()

    if (error) {
      console.error('Error updating task:', error)
      return res.status(500).json({ error: 'Failed to update task' })
    }

    console.log('Task updated successfully:', updatedTask)
    res.status(200).json(updatedTask)

  } catch (error) {
    console.error('Error updating task:', error)
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}