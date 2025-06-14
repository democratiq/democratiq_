import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get all categories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('value')

    if (catError) {
      console.error('Categories error:', catError)
    }

    // Get all workflows with steps
    const { data: workflows, error: workflowError } = await supabase
      .from('workflows')
      .select(`
        *,
        category:categories(value, label),
        steps:workflow_steps(*)
      `)
      .order('created_at', { ascending: false })

    if (workflowError) {
      console.error('Workflows error:', workflowError)
    }

    // Get task workflow steps for recent tasks
    const { data: taskSteps, error: taskStepsError } = await supabase
      .from('task_workflow_steps')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (taskStepsError) {
      console.error('Task steps error:', taskStepsError)
    }

    // Get recent tasks with workflow_id
    const { data: tasksWithWorkflow, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, category, sub_category, workflow_id, created_at')
      .not('workflow_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10)

    if (tasksError) {
      console.error('Tasks error:', tasksError)
    }

    res.status(200).json({
      categories: categories || [],
      workflows: workflows || [],
      recentTaskSteps: taskSteps || [],
      recentTasksWithWorkflow: tasksWithWorkflow || [],
      summary: {
        totalCategories: categories?.length || 0,
        totalWorkflows: workflows?.length || 0,
        workflowsWithSteps: workflows?.filter(w => w.steps && w.steps.length > 0).length || 0,
        tasksWithWorkflows: tasksWithWorkflow?.length || 0
      }
    })
  } catch (error) {
    console.error('Debug error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}