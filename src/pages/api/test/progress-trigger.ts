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
    // Get task current state
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, progress, title')
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    // Get all workflow steps for this task
    const { data: steps, error: stepsError } = await supabase
      .from('task_workflow_steps')
      .select('id, status, title, required')
      .eq('task_id', taskId)
      .order('step_number')

    if (stepsError) {
      return res.status(500).json({ error: 'Failed to fetch steps' })
    }

    if (!steps || steps.length === 0) {
      return res.status(200).json({
        task,
        steps: [],
        message: 'No workflow steps found for this task'
      })
    }

    // Calculate expected progress
    const totalSteps = steps.length
    const completedSteps = steps.filter(step => step.status === 'completed').length
    const expectedProgress = Math.round((completedSteps / totalSteps) * 100)

    // Test if we can call the progress calculation function
    let triggerResult = null
    try {
      const { data: calculatedProgress, error: calcError } = await supabase
        .rpc('calculate_task_progress', { p_task_id: taskId })

      if (calcError) {
        console.error('Error calling progress function:', calcError)
      } else {
        triggerResult = calculatedProgress
      }
    } catch (err) {
      console.error('Error testing trigger function:', err)
    }

    return res.status(200).json({
      task,
      steps,
      analysis: {
        totalSteps,
        completedSteps,
        expectedProgress,
        currentTaskProgress: task.progress,
        triggerFunctionResult: triggerResult,
        progressMatches: task.progress === expectedProgress,
        triggerWorking: triggerResult === expectedProgress
      }
    })
  } catch (error) {
    console.error('Test error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}