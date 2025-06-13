import { NextApiRequest, NextApiResponse } from 'next'

console.log('=== TASK CREATE API FILE LOADED ===')

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('=== TASK CREATE API CALLED ===')
  console.log('Method:', req.method)
  console.log('Body:', JSON.stringify(req.body, null, 2))
  
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
      return
    }

    console.log('Importing taskService...')
    const { taskService } = await import('../../../lib/supabase-admin')
    console.log('taskService imported successfully')

    const {
      title,
      description,
      status = 'open',
      priority = 'medium',
      grievance_type,
      voter_name,
      sub_category,
      assigned_to,
      deadline
    } = req.body

    console.log('Extracted data:', {
      title,
      description,
      status,
      priority,
      grievance_type,
      voter_name,
      sub_category,
      assigned_to,
      deadline
    })

    // Validate required fields
    if (!title || !description || !grievance_type || !voter_name) {
      console.log('Validation failed - missing required fields')
      return res.status(400).json({
        error: 'Missing required fields: title, description, grievance_type, voter_name'
      })
    }

    // Calculate default deadline if not provided
    let taskDeadline = deadline
    if (!taskDeadline) {
      const defaultDays = priority === 'high' ? 3 : priority === 'medium' ? 7 : 14
      const deadlineDate = new Date()
      deadlineDate.setDate(deadlineDate.getDate() + defaultDays)
      taskDeadline = deadlineDate.toISOString()
    }

    // Create the task data
    const taskData = {
      title,
      category: grievance_type,
      sub_category: sub_category && sub_category !== 'none' ? sub_category : undefined,
      status,
      priority,
      progress: 0,
      filled_by: voter_name,
      assigned_to: assigned_to && assigned_to !== 'unassigned' ? assigned_to : null,
      deadline: taskDeadline,
      is_deleted: false,
      ai_summary: description
    }

    console.log('Task data prepared:', taskData)
    console.log('About to call taskService.create...')
    
    const task = await taskService.create(taskData)
    
    console.log('Task created successfully:', task)
    res.status(201).json(task)

  } catch (error) {
    console.error('=== TASK CREATE ERROR ===')
    console.error('Error type:', typeof error)
    console.error('Error:', error)
    console.error('Error stringified:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
    
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    })
  }
}