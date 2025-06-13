import { NextApiRequest, NextApiResponse } from 'next'
import { sopService } from '@/lib/supabase-admin'

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
    const sops = await sopService.getAll()
    res.status(200).json(sops)

  } catch (error) {
    console.error('Error fetching SOPs:', error)
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}