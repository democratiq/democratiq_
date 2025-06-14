import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Task ID is required' })
  }

  if (req.method === 'GET') {
    try {
      console.log('Fetching workflow steps for task ID:', id)
      
      // Get workflow steps for the task
      const { data: steps, error } = await supabase
        .from('task_workflow_steps')
        .select('*')
        .eq('task_id', parseInt(id))
        .order('step_number', { ascending: true })

      if (error) {
        console.error('Error fetching task workflow steps:', error)
        return res.status(500).json({ error: 'Failed to fetch workflow steps' })
      }

      console.log('Found workflow steps:', steps?.length || 0)
      res.status(200).json(steps || [])
    } catch (error) {
      console.error('API Error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else if (req.method === 'PUT') {
    try {
      const { stepId, status, notes, completed_by } = req.body

      if (!stepId || !status) {
        return res.status(400).json({ error: 'Step ID and status are required' })
      }

      const updateData: any = {
        status,
        notes,
        updated_at: new Date().toISOString()
      }

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString()
        updateData.completed_by = completed_by || 'system'
      } else {
        updateData.completed_at = null
        updateData.completed_by = null
      }

      const { data: updatedStep, error } = await supabase
        .from('task_workflow_steps')
        .update(updateData)
        .eq('id', stepId)
        .eq('task_id', parseInt(id))
        .select()
        .single()

      if (error) {
        console.error('Error updating workflow step:', error)
        return res.status(500).json({ error: 'Failed to update workflow step' })
      }

      console.log('Updated step:', updatedStep)
      
      // Manually calculate and update task progress
      try {
        // Get all steps for this task
        const { data: allSteps, error: stepsError } = await supabase
          .from('task_workflow_steps')
          .select('status')
          .eq('task_id', parseInt(id))
        
        if (!stepsError && allSteps) {
          const totalSteps = allSteps.length
          const completedSteps = allSteps.filter(step => step.status === 'completed').length
          const progress = Math.round((completedSteps / totalSteps) * 100)
          
          console.log(`Progress calculation: ${completedSteps}/${totalSteps} = ${progress}%`)
          
          // Update task progress
          const { error: progressError } = await supabase
            .from('tasks')
            .update({ progress, updated_at: new Date().toISOString() })
            .eq('id', parseInt(id))
          
          if (progressError) {
            console.error('Error updating task progress:', progressError)
          } else {
            console.log('Task progress updated to:', progress)
          }
        }
      } catch (progressUpdateError) {
        console.error('Error in progress update:', progressUpdateError)
      }

      res.status(200).json(updatedStep)
    } catch (error) {
      console.error('API Error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}