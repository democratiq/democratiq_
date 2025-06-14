"use client"

import { useState, useEffect } from 'react'
import { AuthGuard } from '@/components/auth-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { IconRefresh, IconUser, IconKey } from '@tabler/icons-react'
import { getCurrentUser, getCurrentSession } from '@/lib/client-auth'

export default function DebugAuthPage() {
  const [authData, setAuthData] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = async () => {
    try {
      setLoading(true)
      
      // Get current user and session
      const user = await getCurrentUser()
      const session = await getCurrentSession()
      
      setAuthData({
        user,
        session: session ? {
          access_token: session.access_token.substring(0, 20) + '...',
          expires_at: session.expires_at,
          user_id: session.user.id
        } : null
      })

      // Try to get user profile
      if (user) {
        try {
          const headers = await import('@/lib/client-auth').then(m => m.getAuthHeaders())
          const response = await fetch('/api/debug/user-profile', {
            headers: await headers
          })
          
          if (response.ok) {
            const profile = await response.json()
            setUserProfile(profile)
          } else {
            const error = await response.json()
            setUserProfile({ error: error.message })
          }
        } catch (error) {
          setUserProfile({ error: error instanceof Error ? error.message : 'Unknown error' })
        }
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setAuthData({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <AuthGuard>
      <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Authentication Debug</h1>
            <p className="text-muted-foreground">
              Check your authentication status and user profile
            </p>
          </div>
          <Button onClick={checkAuth} disabled={loading} className="gap-2">
            <IconRefresh className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconUser className="h-5 w-5" />
                Current User & Session
              </CardTitle>
              <CardDescription>
                Your authentication status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs overflow-auto bg-muted p-4 rounded max-h-96">
                {JSON.stringify(authData, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconKey className="h-5 w-5" />
                User Profile & Role
              </CardTitle>
              <CardDescription>
                Your role and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs overflow-auto bg-muted p-4 rounded max-h-96">
                {JSON.stringify(userProfile, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Checks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${authData?.user ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>User authenticated: {authData?.user ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${authData?.session ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>Session active: {authData?.session ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${userProfile?.profile?.role === 'super_admin' ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>Super admin role: {userProfile?.profile?.role === 'super_admin' ? 'Yes' : 'No'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  )
}