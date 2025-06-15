import { NextApiRequest, NextApiResponse } from 'next'
import { getAuthContext } from '@/lib/api-auth-helpers'
import { getGoogleAuthUrl } from '@/lib/google-oauth'

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
    // Get auth context to determine politician_id
    const authContext = await getAuthContext(req)
    
    if (!authContext) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Generate state parameter with politician_id for security
    const state = Buffer.from(JSON.stringify({
      politicianId: authContext.politicianId,
      userId: authContext.userId,
      timestamp: Date.now()
    })).toString('base64')

    // Generate Google OAuth URL
    const authUrl = getGoogleAuthUrl(state)

    res.status(200).json({ authUrl })

  } catch (error) {
    console.error('Error initiating Google OAuth:', error)
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}