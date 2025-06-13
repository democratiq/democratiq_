import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
    return
  }

  try {
    const { id } = req.query
    const { value, label, subcategories } = req.body

    if (!id) {
      return res.status(400).json({
        error: 'Category ID is required'
      })
    }

    // Validate required fields
    if (!value || !label) {
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

    // Create updated category object
    const updatedCategory = {
      id: id as string,
      value,
      label,
      subcategories: subcategories || [],
      created_at: new Date().toISOString() // In real app, preserve original created_at
    }

    // In a real application, you would update this in a database
    console.log('Updating category:', id, updatedCategory)

    res.status(200).json(updatedCategory)

  } catch (error) {
    console.error('Error updating category:', error)
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}