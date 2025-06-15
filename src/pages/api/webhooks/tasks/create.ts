import { NextApiRequest, NextApiResponse } from 'next'

// Webhook authentication middleware
function authenticateWebhook(req: NextApiRequest): { isValid: boolean; error?: string } {
  const apiKey = req.headers['x-api-key'] as string
  
  if (!apiKey) {
    return { isValid: false, error: 'Missing X-API-Key header' }
  }
  
  const validApiKey = process.env.WEBHOOK_API_KEY
  if (!validApiKey) {
    return { isValid: false, error: 'Webhook API key not configured on server' }
  }
  
  if (apiKey !== validApiKey) {
    return { isValid: false, error: 'Invalid API key' }
  }
  
  return { isValid: true }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('=== WEBHOOK TASK CREATE API CALLED ===')
  console.log('Method:', req.method)
  console.log('Headers:', {
    'x-api-key': req.headers['x-api-key'] ? '[REDACTED]' : 'none',
    'content-type': req.headers['content-type'],
    'user-agent': req.headers['user-agent']
  })
  
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST'])
      res.status(405).json({ error: `Method ${req.method} Not Allowed` })
      return
    }

    // Authenticate webhook
    const authResult = authenticateWebhook(req)
    if (!authResult.isValid) {
      console.log('Authentication failed:', authResult.error)
      res.status(401).json({ 
        error: 'Unauthorized', 
        message: authResult.error,
        timestamp: new Date().toISOString()
      })
      return
    }

    console.log('Webhook authenticated successfully')

    const {
      title,
      description,
      status = 'open',
      priority = 'medium',
      grievance_type,
      voter_name,
      sub_category,
      assigned_to,
      deadline,
      // Additional webhook-specific fields
      source,
      webhook_source,
      external_id,
      webhook_metadata,
      politician_id // Allow webhook to specify politician_id
    } = req.body

    console.log('Extracted webhook data:', {
      title,
      description,
      status,
      priority,
      grievance_type,
      voter_name,
      sub_category,
      assigned_to,
      deadline,
      source,
      webhook_source,
      external_id
    })

    // Validate required fields
    if (!title || !description || !grievance_type || !voter_name) {
      console.log('Validation failed - missing required fields')
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['title', 'description', 'grievance_type', 'voter_name'],
        provided: Object.keys(req.body),
        timestamp: new Date().toISOString()
      })
    }

    // Import task service
    console.log('Importing taskService...')
    const { taskService } = await import('../../../../lib/supabase-admin')
    console.log('taskService imported successfully')

    // Calculate default deadline if not provided
    let taskDeadline = deadline
    if (!taskDeadline) {
      const defaultDays = priority === 'high' ? 3 : priority === 'medium' ? 7 : 14
      const deadlineDate = new Date()
      deadlineDate.setDate(deadlineDate.getDate() + defaultDays)
      taskDeadline = deadlineDate.toISOString()
    }

    // Validate politician_id if provided
    if (!politician_id) {
      console.log('Webhook missing politician_id')
      return res.status(400).json({
        error: 'Missing required field: politician_id',
        message: 'Webhook must specify which politician this task belongs to',
        timestamp: new Date().toISOString()
      })
    }

    // Create the task data with webhook metadata
    const taskData = {
      title: webhook_source ? `[${webhook_source}] ${title}` : title,
      category: grievance_type,
      sub_category: sub_category && sub_category !== 'none' ? sub_category : null,
      status,
      priority,
      progress: 0,
      filled_by: voter_name,
      assigned_to: assigned_to && assigned_to !== 'unassigned' ? assigned_to : null,
      deadline: taskDeadline,
      is_deleted: false,
      ai_summary: description,
      source: source || 'email', // Default to email for webhook unless specified
      politician_id: politician_id, // Set politician_id for multi-tenant isolation
      // Store webhook metadata in ai_summary or create separate field
      ...(webhook_metadata && {
        ai_summary: `${description}\n\nWebhook Metadata: ${JSON.stringify(webhook_metadata)}`
      }),
      ...(external_id && {
        // If you have an external_id field in your tasks table, uncomment this:
        // external_id: external_id
      })
    }

    console.log('Task data prepared:', taskData)
    console.log('About to call taskService.create...')
    
    const task = await taskService.create(taskData)
    
    console.log('Task created successfully via webhook:', task)
    
    // Workflow attachment logic (same as original API)
    console.log('Checking for workflow...')
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // First get the category ID for this politician
    console.log('Looking for category with value:', grievance_type, 'for politician:', politician_id)
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('value', grievance_type)
      .eq('politician_id', politician_id)
      .single()
    
    if (categoryError) {
      console.error('Error fetching category:', categoryError)
    }
    
    if (category) {
      console.log('Found category ID:', category.id)
      console.log('Looking for workflow with subcategory:', sub_category || 'all')
      
      // Look for workflow - first try exact match
      let workflow = null
      let workflowError = null
      
      // If subcategory is provided and not 'none', look for specific workflow
      if (sub_category && sub_category !== 'none') {
        const result = await supabase
          .from('workflows')
          .select(`
            id,
            sla_days,
            sla_hours,
            steps:workflow_steps(*)
          `)
          .eq('category_id', category.id)
          .eq('subcategory', sub_category)
          .maybeSingle()
        
        workflow = result.data
        workflowError = result.error
      }
      
      if (workflowError) {
        console.error('Error fetching workflow:', workflowError)
      }
      
      // If no specific workflow found, try 'all' subcategories
      if (!workflow) {
        console.log('No specific workflow found, trying for all subcategories')
        const { data: allWorkflow, error: allWorkflowError } = await supabase
          .from('workflows')
          .select(`
            id,
            sla_days,
            sla_hours,
            steps:workflow_steps(*)
          `)
          .eq('category_id', category.id)
          .eq('subcategory', 'all')
          .maybeSingle()
        
        if (allWorkflowError) {
          console.error('Error fetching all workflow:', allWorkflowError)
        }
        
        if (allWorkflow) {
          workflow = allWorkflow
          console.log('Found workflow for all subcategories')
        }
      }
      
      if (workflow && workflow.steps && workflow.steps.length > 0) {
        console.log('Found workflow with steps:', workflow.steps.length)
        
        // Update task with workflow_id
        const { error: updateError } = await supabase
          .from('tasks')
          .update({ workflow_id: workflow.id })
          .eq('id', task.id)
        
        if (updateError) {
          console.error('Error updating task with workflow_id:', updateError)
        } else {
          console.log('Updated task with workflow_id:', workflow.id)
        }
        
        // Create task workflow steps
        const taskSteps = workflow.steps.map((step: any) => ({
          task_id: task.id,
          workflow_step_id: step.id,
          step_number: step.step_number,
          title: step.title,
          description: step.description || '',
          duration: step.duration || 0,
          required: step.required !== false,
          status: 'pending'
        }))
        
        console.log('Inserting task workflow steps:', taskSteps.length, 'steps')
        
        const { error: stepsError } = await supabase
          .from('task_workflow_steps')
          .insert(taskSteps)
        
        if (stepsError) {
          console.error('Error inserting task workflow steps:', stepsError)
        } else {
          console.log('Workflow steps attached to task successfully')
        }
      } else {
        console.log('No workflow found for this category/subcategory combination')
      }
    } else {
      console.log('Category not found in database')
    }
    
    // Return success response with task details
    res.status(201).json({
      success: true,
      message: 'Task created successfully via webhook',
      task: {
        id: task.id,
        title: task.title,
        category: task.category,
        sub_category: task.sub_category,
        status: task.status,
        priority: task.priority,
        filled_by: task.filled_by,
        assigned_to: task.assigned_to,
        deadline: task.deadline,
        created_at: task.created_at
      },
      workflow_attached: !!category,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('=== WEBHOOK TASK CREATE ERROR ===')
    console.error('Error type:', typeof error)
    console.error('Error:', error)
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    })
  }
}