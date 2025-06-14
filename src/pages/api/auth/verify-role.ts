import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
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

    // Get auth token
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' })
    }

    const token = authHeader.slice(7)
    
    // Verify token and get user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !user) {
      return res.status(401).json({ 
        error: 'Invalid token',
        details: userError?.message 
      })
    }

    // Get user profile with role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return res.status(404).json({ 
        error: 'User profile not found',
        details: profileError.message 
      })
    }

    res.status(200).json({
      user_id: user.id,
      role: profile.role,
      is_super_admin: profile.role === 'super_admin'
    })

  } catch (error) {
    console.error('Role verification error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error)
    })
  }
}