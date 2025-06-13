import { NextApiRequest, NextApiResponse } from 'next'
import { taskService, staffService } from '@/lib/supabase-admin'

const PRIORITY_POINTS = {
  low: 5,
  medium: 10,
  high: 20
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
    return
  }

  try {
    const { id } = req.query
    const { completed_by, notes } = req.body
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Task ID is required' })
    }

    if (!completed_by) {
      return res.status(400).json({ error: 'completed_by staff ID is required' })
    }

    // Get the task
    const task = await taskService.getById(id)
    
    if (task.status === 'completed') {
      return res.status(400).json({ error: 'Task is already completed' })
    }

    // Update task to completed
    const updatedTask = await taskService.update(id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      assigned_to: completed_by,
      points_awarded: PRIORITY_POINTS[task.priority as keyof typeof PRIORITY_POINTS],
      metadata: {
        ...task.metadata,
        completion_notes: notes,
        completed_by
      }
    })

    // Award points to staff member
    const pointsToAward = PRIORITY_POINTS[task.priority as keyof typeof PRIORITY_POINTS]
    
    try {
      await staffService.updatePoints(completed_by, pointsToAward)
      
      // Update task type history for the staff member
      const staff = await staffService.getById(completed_by)
      const updatedHistory = {
        ...staff.task_type_history,
        [task.grievance_type]: (staff.task_type_history[task.grievance_type] || 0) + 1
      }
      
      await staffService.update(completed_by, {
        task_type_history: updatedHistory
      })

    } catch (staffError) {
      console.error('Error updating staff points:', staffError)
      // Continue anyway - task is marked complete but points might not be awarded
    }

    res.status(200).json({
      task: updatedTask,
      points_awarded: pointsToAward,
      message: 'Task completed successfully'
    })

  } catch (error) {
    console.error('Error completing task:', error)
    
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ error: 'Task not found' })
    } else {
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}