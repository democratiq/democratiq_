import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email } = req.body

  if (!email) {
    return res.status(400).json({ error: 'Email is required' })
  }

  try {
    // First get the user from auth
    const { data: authUser, error: authError } = await supabase.auth.admin.listUsers()
    
    const user = authUser?.users.find(u => u.email === email)
    
    if (!user) {
      return res.status(404).json({ error: 'User not found in auth' })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
    }

    // Get politician info if user has politician_id
    let politician = null
    if (profile?.politician_id) {
      const { data: politicianData } = await supabase
        .from('politicians')
        .select('*')
        .eq('id', profile.politician_id)
        .single()
      
      politician = politicianData
    }

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      profile,
      politician,
      analysis: {
        hasProfile: !!profile,
        hasPoliticianId: !!profile?.politician_id,
        role: profile?.role,
        isActive: profile?.is_active
      }
    })

  } catch (error) {
    console.error('Error in user-check:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}