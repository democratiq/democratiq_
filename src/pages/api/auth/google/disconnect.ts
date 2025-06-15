import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { getAuthContext } from '@/lib/api-auth-helpers'
import { google } from 'googleapis'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
    // Get auth context
    const authContext = await getAuthContext(req)
    
    if (!authContext) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Get current integration to revoke tokens
    const { data: integration, error: fetchError } = await supabase
      .from('calendar_integrations')
      .select('*')
      .eq('politician_id', authContext.politicianId)
      .eq('provider', 'google')
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching integration:', fetchError)
      return res.status(500).json({ error: 'Failed to fetch integration' })
    }

    // If integration exists, revoke the tokens
    if (integration && integration.access_token) {
      try {
        // Revoke the access token with Google
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET
        )
        
        oauth2Client.setCredentials({
          access_token: integration.access_token,
          refresh_token: integration.refresh_token
        })

        await oauth2Client.revokeCredentials()
      } catch (revokeError) {
        console.error('Error revoking Google tokens:', revokeError)
        // Continue with local cleanup even if revocation fails
      }
    }

    // Update integration status to disconnected and clear sensitive data
    const { error: updateError } = await supabase
      .from('calendar_integrations')
      .update({
        status: 'disconnected',
        access_token: null,
        refresh_token: null,
        token_expires_at: null,
        calendars_connected: 0,
        last_sync: null,
        updated_at: new Date().toISOString()
      })
      .eq('politician_id', authContext.politicianId)
      .eq('provider', 'google')

    if (updateError) {
      console.error('Error updating integration:', updateError)
      return res.status(500).json({ error: 'Failed to disconnect calendar' })
    }

    // Create audit log entry
    await supabase.from('notifications').insert({
      type: 'calendar_sync',
      title: 'Google Calendar Disconnected',
      message: 'Google Calendar has been disconnected from your account',
      politician_id: authContext.politicianId,
      created_at: new Date().toISOString()
    })

    res.status(200).json({ 
      success: true, 
      message: 'Google Calendar disconnected successfully' 
    })

  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error)
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}