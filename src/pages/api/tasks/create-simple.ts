import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('=== CREATE SIMPLE API CALLED ===')
  console.log('Method:', req.method)
  console.log('Body:', req.body)
  
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    // Just return success without database operations
    const mockTask = {
      id: Math.floor(Math.random() * 1000),
      title: req.body.title || 'Test Task',
      category: req.body.grievance_type || 'general',
      status: 'open',
      created_at: new Date().toISOString()
    }

    console.log('Returning mock task:', mockTask)
    res.status(201).json(mockTask)
    
  } catch (error) {
    console.error('=== CREATE SIMPLE API ERROR ===', error)
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}