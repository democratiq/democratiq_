import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

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
    // Get auth token to determine user's politician_id
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' })
    }

    const token = authHeader.slice(7)
    
    // Get user and their politician_id
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    // Get user profile to find politician_id
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('politician_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return res.status(403).json({ error: 'User profile not found' })
    }

    // Build query based on role
    let query = supabase
      .from('categories')
      .select('*')

    // If not super_admin, filter by politician_id
    if (profile.role !== 'super_admin' && profile.politician_id) {
      query = query.eq('politician_id', profile.politician_id)
    }

    const { data: categories, error } = await query
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching categories:', error)
      return res.status(500).json({ error: 'Failed to fetch categories' })
    }

    res.status(200).json(categories)

  } catch (error) {
    console.error('Error fetching categories:', error)
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}