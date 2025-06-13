import { NextApiRequest, NextApiResponse } from 'next'
import { taskService } from '@/lib/supabase-admin'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
    return
  }

  try {
    const { status, category } = req.query

    const filters: { status?: string; category?: string } = {}
    if (status && typeof status === 'string') filters.status = status
    if (category && typeof category === 'string') filters.category = category

    const tasks = await taskService.getAll(filters)

    res.status(200).json(tasks)

  } catch (error) {
    console.error('Error fetching tasks:', error)
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}