import { NextApiRequest } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface AuthResult {
  isValid: boolean
  error?: string
  userId?: string
  role?: string
}

export async function verifyApiKeyOrSuperAdmin(req: NextApiRequest): Promise<AuthResult> {
  try {
    // Check for API key first (for webhook access)
    const apiKey = req.headers['x-api-key'] as string
    if (apiKey) {
      const validApiKey = process.env.WEBHOOK_API_KEY
      if (!validApiKey) {
        return { isValid: false, error: 'Webhook API key not configured on server' }
      }
      
      if (apiKey === validApiKey) {
        return { isValid: true, role: 'api_key' }
      } else {
        return { isValid: false, error: 'Invalid API key' }
      }
    }

    // Check for Bearer token (for super admin access)
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return { isValid: false, error: 'Missing authorization header or API key' }
    }

    const token = authHeader.slice(7)
    
    // Verify token and get user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !user) {
      return { 
        isValid: false, 
        error: 'Invalid token: ' + (userError?.message || 'User not found')
      }
    }

    // Get user profile with role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return { 
        isValid: false, 
        error: 'User profile not found: ' + profileError.message 
      }
    }

    // Check if user is super admin
    if (profile.role !== 'super_admin') {
      return { 
        isValid: false, 
        error: 'Access denied: Super admin role required' 
      }
    }

    return { 
      isValid: true, 
      userId: user.id,
      role: profile.role
    }

  } catch (error) {
    console.error('Auth verification error:', error)
    return { 
      isValid: false, 
      error: 'Authentication failed: ' + (error instanceof Error ? error.message : String(error))
    }
  }
}