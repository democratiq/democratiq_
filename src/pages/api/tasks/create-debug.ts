import { NextApiRequest, NextApiResponse } from 'next'

console.log('=== CREATE DEBUG API FILE LOADED ===')

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('=== CREATE DEBUG API CALLED ===')
  console.log('Method:', req.method)
  console.log('Headers:', req.headers)
  console.log('Body:', req.body)
  
  if (req.method === 'POST') {
    res.status(200).json({ 
      success: true, 
      message: 'Debug endpoint working',
      receivedData: req.body 
    })
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}