import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
    return
  }

  try {
    const { id } = req.query

    if (!id) {
      return res.status(400).json({
        error: 'Category ID is required'
      })
    }

    // In a real application, you would:
    // 1. Check if any tasks are using this category
    // 2. Either prevent deletion or reassign tasks to another category
    // 3. Delete from database
    
    console.log('Deleting category:', id)

    // For demo purposes, we'll just return success
    res.status(200).json({ 
      message: 'Category deleted successfully',
      id: id 
    })

  } catch (error) {
    console.error('Error deleting category:', error)
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}