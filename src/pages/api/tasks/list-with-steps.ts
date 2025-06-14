import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
    return
  }

  try {
    // Get all tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError)
      return res.status(500).json({ error: 'Failed to fetch tasks' })
    }

    // Get step counts for all tasks (some may have steps even without workflow_id due to the bug)
    const taskIds = tasks?.map(t => t.id) || []
    
    let stepCounts: Record<number, { total: number; completed: number }> = {}
    
    if (taskIds.length > 0) {
      const { data: stepData, error: stepError } = await supabase
        .from('task_workflow_steps')
        .select('task_id, status')
        .in('task_id', taskIds)

      if (stepError) {
        console.error('Error fetching step counts:', stepError)
      } else if (stepData) {
        // Calculate counts for each task
        stepCounts = stepData.reduce((acc, step) => {
          if (!acc[step.task_id]) {
            acc[step.task_id] = { total: 0, completed: 0 }
          }
          acc[step.task_id].total++
          if (step.status === 'completed') {
            acc[step.task_id].completed++
          }
          return acc
        }, {} as Record<number, { total: number; completed: number }>)
      }
    }

    // Combine tasks with step counts
    const tasksWithSteps = tasks?.map(task => ({
      ...task,
      totalSteps: stepCounts[task.id]?.total || 0,
      completedSteps: stepCounts[task.id]?.completed || 0
    })) || []

    console.log('Step counts calculated:', Object.keys(stepCounts).length, 'tasks with steps')
    console.log('Sample step data:', Object.entries(stepCounts).slice(0, 3))
    console.log('Sample task with steps:', tasksWithSteps.filter(t => t.totalSteps > 0).slice(0, 2).map(t => ({
      id: t.id,
      workflow_id: t.workflow_id,
      totalSteps: t.totalSteps,
      completedSteps: t.completedSteps
    })))

    res.status(200).json(tasksWithSteps)
  } catch (error) {
    console.error('API Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}