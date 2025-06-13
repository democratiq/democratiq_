import { NextApiRequest, NextApiResponse } from 'next'
import { sopService } from '@/lib/supabase-admin'
import { SOP } from '@/lib/database-types'

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
    const {
      title,
      task_type,
      description,
      steps,
      created_by
    } = req.body

    // Validate required fields
    if (!title || !task_type || !description || !steps || !created_by) {
      return res.status(400).json({
        error: 'Missing required fields: title, task_type, description, steps, created_by'
      })
    }

    // Validate steps structure
    if (!Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({
        error: 'Steps must be a non-empty array'
      })
    }

    // Validate each step
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      if (!step.title || !step.description) {
        return res.status(400).json({
          error: `Step ${i + 1} must have title and description`
        })
      }
    }

    // Add step numbers and generate IDs
    const processedSteps = steps.map((step, index) => ({
      id: `step-${Date.now()}-${index}`,
      step_number: index + 1,
      title: step.title,
      description: step.description,
      is_required: step.is_required ?? true,
      estimated_time_minutes: step.estimated_time_minutes ?? 15
    }))

    // Create SOP
    const sopData: Omit<SOP, 'id' | 'created_at' | 'updated_at'> = {
      title,
      task_type,
      description,
      steps: processedSteps,
      is_active: true,
      created_by
    }

    const sop = await sopService.create(sopData)

    res.status(201).json(sop)

  } catch (error) {
    console.error('Error creating SOP:', error)
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}