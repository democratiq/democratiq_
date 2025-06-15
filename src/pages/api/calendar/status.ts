import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { getAuthContext } from '@/lib/api-auth-helpers'
import { validateGoogleTokens } from '@/lib/google-oauth'

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
    // Get auth context
    const authContext = await getAuthContext(req)
    
    if (!authContext) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Get calendar integrations for this politician
    const { data: integrations, error } = await supabase
      .from('calendar_integrations')
      .select(`
        id,
        provider,
        status,
        email,
        calendars_connected,
        last_sync,
        token_expires_at,
        created_at,
        updated_at,
        user_profile,
        calendar_list
      `)
      .eq('politician_id', authContext.politicianId)

    if (error) {
      console.error('Error fetching calendar integrations:', error)
      return res.status(500).json({ error: 'Failed to fetch calendar status' })
    }

    // Process each integration to check token validity
    const processedIntegrations = await Promise.all(
      (integrations || []).map(async (integration) => {
        let actualStatus = integration.status
        let needsReauth = false

        // For connected Google integrations, validate tokens
        if (integration.provider === 'google' && integration.status === 'connected') {
          try {
            // Get the full integration with sensitive data for validation
            const { data: fullIntegration } = await supabase
              .from('calendar_integrations')
              .select('access_token, refresh_token')
              .eq('id', integration.id)
              .single()

            if (fullIntegration?.access_token) {
              const tokenValidation = await validateGoogleTokens(
                fullIntegration.access_token,
                fullIntegration.refresh_token
              )

              if (tokenValidation === false) {
                actualStatus = 'error'
                needsReauth = true
                
                // Update status in database
                await supabase
                  .from('calendar_integrations')
                  .update({ status: 'error' })
                  .eq('id', integration.id)
              } else if (typeof tokenValidation === 'object' && tokenValidation.refreshed) {
                // Token was refreshed, update in database
                await supabase
                  .from('calendar_integrations')
                  .update({
                    access_token: tokenValidation.tokens.access_token,
                    token_expires_at: tokenValidation.tokens.expiry_date 
                      ? new Date(tokenValidation.tokens.expiry_date).toISOString()
                      : null,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', integration.id)
              }
            }
          } catch (validationError) {
            console.error('Token validation error:', validationError)
            actualStatus = 'error'
            needsReauth = true
          }
        }

        return {
          ...integration,
          status: actualStatus,
          needsReauth,
          // Don't expose sensitive data
          access_token: undefined,
          refresh_token: undefined
        }
      })
    )

    // Create default entries for providers that don't exist
    const supportedProviders = ['google', 'outlook']
    const existingProviders = processedIntegrations.map(i => i.provider)
    
    const defaultIntegrations = supportedProviders
      .filter(provider => !existingProviders.includes(provider))
      .map(provider => ({
        provider,
        status: 'disconnected',
        email: null,
        calendars_connected: 0,
        last_sync: null,
        token_expires_at: null,
        user_profile: null,
        calendar_list: null,
        needsReauth: false
      }))

    const allIntegrations = [...processedIntegrations, ...defaultIntegrations]

    res.status(200).json({ integrations: allIntegrations })

  } catch (error) {
    console.error('Error getting calendar status:', error)
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}