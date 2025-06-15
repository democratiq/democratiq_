import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { taskId } = req.body

  if (!taskId) {
    return res.status(400).json({ error: 'Task ID is required' })
  }

  try {
    // Fetch task with service role to bypass RLS
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    if (taskError) {
      console.error('Error fetching task:', taskError)
      return res.status(404).json({ error: 'Task not found', details: taskError })
    }

    // Also fetch the politician info if task has politician_id
    let politician = null
    if (task?.politician_id) {
      const { data: politicianData } = await supabase
        .from('politicians')
        .select('*')
        .eq('id', task.politician_id)
        .single()
      
      politician = politicianData
    }

    return res.status(200).json({
      task,
      politician,
      analysis: {
        hasPoliticianId: !!task?.politician_id,
        status: task?.status,
        createdAt: task?.created_at,
        assignedTo: task?.assigned_to
      }
    })

  } catch (error) {
    console.error('Error in task-check:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}