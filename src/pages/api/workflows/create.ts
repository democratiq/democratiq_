import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
    return
  }

  try {
    const { category_id, subcategory, sla_days, sla_hours, warning_threshold, steps } = req.body

    // Validate required fields
    if (!category_id || !sla_days || !steps || steps.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields: category_id, sla_days, and steps are required'
      })
    }

    // Validate steps
    for (const step of steps) {
      if (!step.title) {
        return res.status(400).json({
          error: 'All workflow steps must have a title'
        })
      }
    }

    // Start a transaction by creating the workflow first
    const { data: workflow, error: workflowError } = await supabase
      .from('workflows')
      .insert({
        category_id,
        subcategory: subcategory || 'all',
        sla_days: parseInt(sla_days),
        sla_hours: parseInt(sla_hours) || 0,
        warning_threshold: parseInt(warning_threshold) || 80
      })
      .select()
      .single()

    if (workflowError) {
      console.error('Error creating workflow:', workflowError)
      return res.status(500).json({ error: 'Failed to create workflow' })
    }

    // Create workflow steps
    const stepsToInsert = steps.map((step: any, index: number) => ({
      workflow_id: workflow.id,
      step_number: index + 1,
      title: step.title,
      description: step.description || '',
      duration: parseInt(step.duration) || 0,
      required: step.required !== false // Default to true
    }))

    const { data: createdSteps, error: stepsError } = await supabase
      .from('workflow_steps')
      .insert(stepsToInsert)
      .select()

    if (stepsError) {
      console.error('Error creating workflow steps:', stepsError)
      // Rollback workflow creation
      await supabase.from('workflows').delete().eq('id', workflow.id)
      return res.status(500).json({ error: 'Failed to create workflow steps' })
    }

    // Return the complete workflow with steps
    const completeWorkflow = {
      ...workflow,
      steps: createdSteps
    }

    res.status(201).json(completeWorkflow)
  } catch (error) {
    console.error('API Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}