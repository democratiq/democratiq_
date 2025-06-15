import { NextApiRequest } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface AuthContext {
  userId: string
  role: 'super_admin' | 'admin' | 'staff' | 'agent'
  politicianId: string | null
}

/**
 * Get the authenticated user's context including their politician_id
 * This is critical for multi-tenant data isolation
 */
export async function getAuthContext(req: NextApiRequest): Promise<AuthContext | null> {
  try {
    // Get auth token
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.slice(7)
    
    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      return null
    }

    // Get user profile with politician_id
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, politician_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return null
    }

    return {
      userId: user.id,
      role: profile.role,
      politicianId: profile.politician_id
    }
  } catch (error) {
    console.error('Error getting auth context:', error)
    return null
  }
}

/**
 * Apply politician_id filter to a query if needed
 * Super admins can see all data, others only see their politician's data
 */
export function applyPoliticianFilter<T extends any>(
  query: T,
  authContext: AuthContext,
  columnName: string = 'politician_id'
): T {
  if (authContext.role !== 'super_admin' && authContext.politicianId) {
    return (query as any).eq(columnName, authContext.politicianId)
  }
  return query
}