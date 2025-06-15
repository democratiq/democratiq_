import { google } from 'googleapis'

// Google OAuth configuration
export const getGoogleOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`
  )
}

// Generate the Google OAuth URL
export const getGoogleAuthUrl = (state: string) => {
  const oauth2Client = getGoogleOAuth2Client()
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // Force consent screen to get refresh token
    scope: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ],
    state // We'll use this to identify the politician
  })
}

// Exchange authorization code for tokens
export const getGoogleTokens = async (code: string) => {
  const oauth2Client = getGoogleOAuth2Client()
  
  try {
    const { tokens } = await oauth2Client.getToken(code)
    return tokens
  } catch (error) {
    console.error('Error getting Google tokens:', error)
    throw new Error('Failed to exchange authorization code for tokens')
  }
}

// Refresh access token using refresh token
export const refreshGoogleToken = async (refreshToken: string) => {
  const oauth2Client = getGoogleOAuth2Client()
  oauth2Client.setCredentials({ refresh_token: refreshToken })
  
  try {
    const { credentials } = await oauth2Client.refreshAccessToken()
    return credentials
  } catch (error) {
    console.error('Error refreshing Google token:', error)
    throw new Error('Failed to refresh access token')
  }
}

// Get user profile information
export const getGoogleUserProfile = async (accessToken: string) => {
  const oauth2Client = getGoogleOAuth2Client()
  oauth2Client.setCredentials({ access_token: accessToken })
  
  try {
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const { data } = await oauth2.userinfo.get()
    return data
  } catch (error) {
    console.error('Error getting Google user profile:', error)
    throw new Error('Failed to get user profile')
  }
}

// Get list of calendars
export const getGoogleCalendars = async (accessToken: string) => {
  const oauth2Client = getGoogleOAuth2Client()
  oauth2Client.setCredentials({ access_token: accessToken })
  
  try {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
    const { data } = await calendar.calendarList.list()
    return data.items || []
  } catch (error) {
    console.error('Error getting Google calendars:', error)
    throw new Error('Failed to get calendars')
  }
}

// Validate if tokens are still valid
export const validateGoogleTokens = async (accessToken: string, refreshToken?: string) => {
  const oauth2Client = getGoogleOAuth2Client()
  oauth2Client.setCredentials({ 
    access_token: accessToken,
    refresh_token: refreshToken 
  })
  
  try {
    // Try to make a simple API call to validate the token
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    await oauth2.userinfo.get()
    return true
  } catch (error) {
    // If access token is expired, try to refresh it
    if (refreshToken) {
      try {
        const newTokens = await refreshGoogleToken(refreshToken)
        return { refreshed: true, tokens: newTokens }
      } catch (refreshError) {
        return false
      }
    }
    return false
  }
}