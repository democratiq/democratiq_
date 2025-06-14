import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
    return
  }

  try {
    const { id } = req.query

    if (!id) {
      return res.status(400).json({
        error: 'Workflow ID is required'
      })
    }

    // Check if any tasks are using this workflow
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id')
      .eq('workflow_id', id)
      .limit(1)

    if (tasksError) {
      console.error('Error checking tasks:', tasksError)
      return res.status(500).json({ error: 'Failed to check workflow usage' })
    }

    if (tasks && tasks.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete workflow that is being used by existing tasks'
      })
    }

    // Delete workflow (steps will be cascade deleted)
    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting workflow:', error)
      return res.status(500).json({ error: 'Failed to delete workflow' })
    }

    console.log('Deleted workflow:', id)
    res.status(200).json({
      message: 'Workflow deleted successfully',
      id: id
    })
  } catch (error) {
    console.error('API Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}