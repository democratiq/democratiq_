import { NextApiRequest, NextApiResponse } from 'next'
import { taskService } from '@/lib/supabase-admin'

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
    const updates = req.body

    console.log('Update API called with ID:', id, 'Updates:', updates)

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Task ID is required' })
    }

    const taskId = parseInt(id)
    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task ID' })
    }

    // Validate that we have some updates
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No updates provided' })
    }

    console.log('Calling taskService.update with:', taskId, updates)
    const updatedTask = await taskService.update(taskId, updates)

    res.status(200).json(updatedTask)

  } catch (error) {
    console.error('Error updating task:', error)
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}