import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
    console.log('Create category request body:', req.body)
    const { value, label, subcategories } = req.body

    // Validate required fields
    if (!value || !label) {
      console.log('Validation failed: missing value or label')
      return res.status(400).json({
        error: 'Missing required fields: value and label are required'
      })
    }

    // Validate value format (should be lowercase, no spaces)
    if (!/^[a-z][a-z0-9_]*$/.test(value)) {
      return res.status(400).json({
        error: 'Category value must be lowercase alphanumeric with underscores only, starting with a letter'
      })
    }

    // Insert into Supabase
    const { data: newCategory, error } = await supabase
      .from('categories')
      .insert({
        value,
        label,
        subcategories: subcategories || []
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating category:', error)
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({
          error: 'A category with this value already exists'
        })
      }
      return res.status(500).json({ error: 'Failed to create category' })
    }

    console.log('Creating category:', newCategory)
    res.status(201).json(newCategory)

  } catch (error) {
    console.error('Error creating category:', error)
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}