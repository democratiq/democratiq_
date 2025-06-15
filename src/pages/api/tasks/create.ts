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

    // Get auth context to determine politician_id
    const { getAuthContext } = await import('../../../lib/api-auth-helpers')
    const authContext = await getAuthContext(req)
    
    if (!authContext) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    console.log('Auth context:', authContext)

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
      deadline,
      source = 'manual_entry'
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
      deadline,
      source
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

    // Create the task data with politician_id
    const taskData = {
      title,
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
      source,
      politician_id: authContext.politicianId // Add politician_id for multi-tenant isolation
    }

    console.log('Task data prepared:', taskData)
    console.log('About to call taskService.create...')
    
    const task = await taskService.create(taskData)
    
    console.log('Task created successfully:', task)
    
    // Check if there's a workflow for this category/subcategory combination
    console.log('Checking for workflow...')
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // First get the category ID for this politician
    console.log('Looking for category with value:', grievance_type, 'for politician:', authContext.politicianId)
    let categoryQuery = supabase
      .from('categories')
      .select('id')
      .eq('value', grievance_type)
    
    // Filter by politician_id if user is not super admin
    if (authContext.role !== 'super_admin' && authContext.politicianId) {
      categoryQuery = categoryQuery.eq('politician_id', authContext.politicianId)
    }
    
    const { data: category, error: categoryError } = await categoryQuery.single()
    
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
        let workflowQuery = supabase
          .from('workflows')
          .select(`
            id,
            sla_days,
            sla_hours,
            steps:workflow_steps(*)
          `)
          .eq('category_id', category.id)
          .eq('subcategory', sub_category)
        
        // Filter by politician_id if user is not super admin
        if (authContext.role !== 'super_admin' && authContext.politicianId) {
          workflowQuery = workflowQuery.eq('politician_id', authContext.politicianId)
        }
        
        const result = await workflowQuery.maybeSingle()
        
        workflow = result.data
        workflowError = result.error
      }
      
      if (workflowError) {
        console.error('Error fetching workflow:', workflowError)
      }
      
      // If no specific workflow found, try 'all' subcategories
      if (!workflow) {
        console.log('No specific workflow found, trying for all subcategories')
        let allWorkflowQuery = supabase
          .from('workflows')
          .select(`
            id,
            sla_days,
            sla_hours,
            steps:workflow_steps(*)
          `)
          .eq('category_id', category.id)
          .eq('subcategory', 'all')
        
        // Filter by politician_id if user is not super admin
        if (authContext.role !== 'super_admin' && authContext.politicianId) {
          allWorkflowQuery = allWorkflowQuery.eq('politician_id', authContext.politicianId)
        }
        
        const { data: allWorkflow, error: allWorkflowError } = await allWorkflowQuery.maybeSingle()
        
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
        console.log('Workflow steps:', JSON.stringify(workflow.steps, null, 2))
        
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
        
        console.log('Inserting task workflow steps:', JSON.stringify(taskSteps, null, 2))
        
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