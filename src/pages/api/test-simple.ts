import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('Simple test API called')
  
  try {
    res.status(200).json({ 
      success: true, 
      message: 'Test API working',
      method: req.method,
      body: req.body
    })
  } catch (error) {
    console.error('Simple test error:', error)
    res.status(500).json({ error: 'Test failed' })
  }
}