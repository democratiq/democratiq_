import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
    return
  }

  try {
    const { id } = req.query
    const { category_id, subcategory, sla_days, sla_hours, warning_threshold, steps } = req.body

    if (!id) {
      return res.status(400).json({
        error: 'Workflow ID is required'
      })
    }

    // Validate required fields
    if (!category_id || !sla_days || !steps || steps.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields: category_id, sla_days, and steps are required'
      })
    }

    // Update workflow
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .update({
        category_id,
        subcategory: subcategory || 'all',
        sla_days: parseInt(sla_days),
        sla_hours: parseInt(sla_hours) || 0,
        warning_threshold: parseInt(warning_threshold) || 80
      })
      .eq('id', id)
      .select()
      .single()

    if (workflowError) {
      console.error('Error updating workflow:', workflowError)
      return res.status(500).json({ error: 'Failed to update workflow' })
    }

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' })
    }

    // Delete existing steps
    const { error: deleteError } = await supabase
      .from('workflow_steps')
      .delete()
      .eq('workflow_id', id)

    if (deleteError) {
      console.error('Error deleting old workflow steps:', deleteError)
      return res.status(500).json({ error: 'Failed to update workflow steps' })
    }

    // Create new workflow steps
    const stepsToInsert = steps.map((step: any, index: number) => ({
      workflow_id: id,
      step_number: index + 1,
      title: step.title,
      description: step.description || '',
      duration: parseInt(step.duration) || 0,
      required: step.required !== false
    }))

    const { data: createdSteps, error: stepsError } = await supabase
      .from('workflow_steps')
      .insert(stepsToInsert)
      .select()

    if (stepsError) {
      console.error('Error creating new workflow steps:', stepsError)
      return res.status(500).json({ error: 'Failed to create new workflow steps' })
    }

    // Return the complete workflow with steps
    const completeWorkflow = {
      ...workflow,
      steps: createdSteps
    }

    res.status(200).json(completeWorkflow)
  } catch (error) {
    console.error('API Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}