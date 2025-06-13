import { NextApiRequest, NextApiResponse } from 'next'
import { taskService } from '@/lib/supabase-admin'

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
    const { id: taskId, stepId } = req.query
    const { completed_by, notes } = req.body
    
    if (!taskId || typeof taskId !== 'string') {
      return res.status(400).json({ error: 'Task ID is required' })
    }

    if (!stepId || typeof stepId !== 'string') {
      return res.status(400).json({ error: 'Step ID is required' })
    }

    if (!completed_by) {
      return res.status(400).json({ error: 'completed_by staff ID is required' })
    }

    // Get the task
    const task = await taskService.getById(taskId)
    
    if (!task.sop_steps || task.sop_steps.length === 0) {
      return res.status(400).json({ error: 'Task has no SOP steps to complete' })
    }

    // Find the step to complete
    const stepIndex = task.sop_steps.findIndex(step => step.id === stepId)
    if (stepIndex === -1) {
      return res.status(404).json({ error: 'Step not found' })
    }

    const stepToComplete = task.sop_steps[stepIndex]
    
    // Check if step is already completed
    if (stepToComplete.is_completed) {
      return res.status(400).json({ error: 'Step is already completed' })
    }

    // Enforce sequential completion - check if previous steps are completed
    for (let i = 0; i < stepIndex; i++) {
      const previousStep = task.sop_steps[i]
      if (previousStep.is_required && !previousStep.is_completed) {
        return res.status(400).json({
          error: `Cannot complete step ${stepToComplete.step_number}. Previous required step "${previousStep.title}" must be completed first.`,
          required_step: {
            id: previousStep.id,
            step_number: previousStep.step_number,
            title: previousStep.title
          }
        })
      }
    }

    // Update the step as completed
    const updatedSteps = task.sop_steps.map(step => 
      step.id === stepId 
        ? {
            ...step,
            is_completed: true,
            completed_by,
            completed_at: new Date().toISOString(),
            notes: notes || undefined
          }
        : step
    )

    // Check if all required steps are completed
    const allRequiredStepsCompleted = updatedSteps.every(step => 
      !step.is_required || step.is_completed
    )

    // Update task with new steps and potentially change status
    const taskUpdateData: any = {
      sop_steps: updatedSteps,
      metadata: {
        ...task.metadata,
        last_step_completed: stepToComplete.title,
        last_step_completed_at: new Date().toISOString(),
        last_step_completed_by: completed_by
      }
    }

    // If all required steps are completed, update task status
    if (allRequiredStepsCompleted && task.status !== 'completed') {
      taskUpdateData.status = 'completed'
      taskUpdateData.completed_at = new Date().toISOString()
    } else if (task.status === 'open') {
      taskUpdateData.status = 'in_progress'
    }

    const updatedTask = await taskService.update(taskId, taskUpdateData)

    res.status(200).json({
      task: updatedTask,
      completed_step: {
        id: stepId,
        step_number: stepToComplete.step_number,
        title: stepToComplete.title,
        completed_at: new Date().toISOString()
      },
      all_required_completed: allRequiredStepsCompleted,
      message: `Step "${stepToComplete.title}" completed successfully`
    })

  } catch (error) {
    console.error('Error completing task step:', error)
    
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