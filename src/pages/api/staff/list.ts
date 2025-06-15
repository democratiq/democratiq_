import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { getAuthContext, applyPoliticianFilter } from '@/lib/api-auth-helpers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
    // Get auth context to determine politician_id
    const authContext = await getAuthContext(req)
    
    if (!authContext) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { role } = req.query

    // Start query
    let query = supabase
      .from('staff')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    // Apply politician filter if user is not super admin
    query = applyPoliticianFilter(query, authContext)

    // Filter by role if specified
    if (role && typeof role === 'string') {
      query = query.eq('role', role)
    }

    const { data: staff, error } = await query

    if (error) {
      console.error('Error fetching staff:', error)
      return res.status(500).json({ error: 'Failed to fetch staff' })
    }

    res.status(200).json(staff || [])
  } catch (error) {
    console.error('Error fetching staff:', error)
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}