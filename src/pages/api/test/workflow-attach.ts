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

  const { category, subcategory } = req.body

  try {
    // First get the category ID
    console.log('Looking for category:', category)
    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .select('id, value, label')
      .eq('value', category)
      .single()

    if (categoryError || !categoryData) {
      return res.status(404).json({ 
        error: 'Category not found', 
        details: categoryError,
        searchedValue: category 
      })
    }

    console.log('Found category:', categoryData)

    // Look for workflow
    let workflow = null
    
    // Try specific subcategory first
    if (subcategory && subcategory !== 'none') {
      const { data: specificWorkflow } = await supabase
        .from('workflows')
        .select(`
          id,
          category_id,
          subcategory,
          sla_days,
          sla_hours,
          steps:workflow_steps(*)
        `)
        .eq('category_id', categoryData.id)
        .eq('subcategory', subcategory)
        .maybeSingle()

      if (specificWorkflow) {
        workflow = specificWorkflow
        console.log('Found specific workflow for subcategory:', subcategory)
      }
    }

    // Try 'all' if no specific workflow found
    if (!workflow) {
      const { data: allWorkflow } = await supabase
        .from('workflows')
        .select(`
          id,
          category_id,
          subcategory,
          sla_days,
          sla_hours,
          steps:workflow_steps(*)
        `)
        .eq('category_id', categoryData.id)
        .eq('subcategory', 'all')
        .maybeSingle()

      if (allWorkflow) {
        workflow = allWorkflow
        console.log('Found workflow for all subcategories')
      }
    }

    res.status(200).json({
      category: categoryData,
      subcategory: subcategory || 'none',
      workflow: workflow,
      workflowFound: !!workflow,
      stepsCount: workflow?.steps?.length || 0
    })
  } catch (error) {
    console.error('Test error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}