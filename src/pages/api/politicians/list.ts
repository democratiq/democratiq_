import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { verifyApiKeyOrSuperAdmin } from '../../../lib/server-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ error: `Method ${req.method} Not Allowed` })
      return
    }

    // Verify super admin access
    const authResult = await verifyApiKeyOrSuperAdmin(req)
    if (!authResult.isValid) {
      res.status(403).json({ 
        error: 'Forbidden', 
        message: authResult.error 
      })
      return
    }

    // Fetch all politicians
    const { data: politicians, error } = await supabase
      .from('politicians')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching politicians:', error)
      return res.status(500).json({
        error: 'Failed to fetch politicians',
        details: error.message
      })
    }

    res.status(200).json(politicians || [])

  } catch (error) {
    console.error('API Error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error)
    })
  }
}