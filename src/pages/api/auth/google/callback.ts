import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { getGoogleTokens, getGoogleUserProfile, getGoogleCalendars } from '@/lib/google-oauth'

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
    const { code, state, error } = req.query

    // Handle OAuth errors
    if (error) {
      console.error('Google OAuth error:', error)
      return res.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/settings?error=oauth_denied`)
    }

    if (!code || !state) {
      return res.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/settings?error=missing_parameters`)
    }

    // Decode and validate state parameter
    let stateData
    try {
      stateData = JSON.parse(Buffer.from(state as string, 'base64').toString())
    } catch (decodeError) {
      return res.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/settings?error=invalid_state`)
    }

    const { politicianId, userId, timestamp } = stateData

    // Check if state is not too old (15 minutes max)
    if (Date.now() - timestamp > 15 * 60 * 1000) {
      return res.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/settings?error=expired_state`)
    }

    // Exchange authorization code for tokens
    const tokens = await getGoogleTokens(code as string)

    if (!tokens.access_token) {
      return res.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/settings?error=no_access_token`)
    }

    // Get user profile information
    const userProfile = await getGoogleUserProfile(tokens.access_token)

    // Get list of calendars
    const calendars = await getGoogleCalendars(tokens.access_token)

    // Calculate token expiry time
    const tokenExpiresAt = tokens.expiry_date 
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000) // Default to 1 hour

    // Save or update calendar integration in database
    const integrationData = {
      politician_id: politicianId,
      provider: 'google',
      status: 'connected',
      email: userProfile.email,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: tokenExpiresAt.toISOString(),
      calendars_connected: calendars.length,
      last_sync: new Date().toISOString(),
      user_profile: {
        id: userProfile.id,
        name: userProfile.name,
        email: userProfile.email,
        picture: userProfile.picture
      },
      calendar_list: calendars.map(cal => ({
        id: cal.id,
        summary: cal.summary,
        primary: cal.primary || false,
        accessRole: cal.accessRole
      })),
      updated_at: new Date().toISOString()
    }

    // Use upsert to handle both new connections and reconnections
    const { error: dbError } = await supabase
      .from('calendar_integrations')
      .upsert(integrationData, {
        onConflict: 'politician_id,provider'
      })

    if (dbError) {
      console.error('Error saving calendar integration:', dbError)
      return res.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/settings?error=database_error`)
    }

    // Create audit log entry
    await supabase.from('notifications').insert({
      type: 'calendar_sync',
      title: 'Google Calendar Connected',
      message: `Google Calendar successfully connected for ${userProfile.email}`,
      politician_id: politicianId,
      created_at: new Date().toISOString()
    })

    // Redirect to settings page with success message
    res.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/settings?success=calendar_connected&calendars=${calendars.length}`)

  } catch (error) {
    console.error('Error in Google OAuth callback:', error)
    res.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/settings?error=callback_error`)
  }
}