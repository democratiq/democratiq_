"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SuperAdminGuard } from '@/components/super-admin-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  IconPlus, IconSearch, IconEdit, IconTrash, IconLoader, 
  IconUser, IconBuilding, IconCrown, IconCalendar,
  IconCheck, IconX, IconClock
} from '@tabler/icons-react'
import { toast } from 'sonner'
import { Politician } from '@/lib/database-types'
import { TableLoader } from '@/components/page-loader'

export default function ClientsPage() {
  const router = useRouter()
  const [politicians, setPoliticians] = useState<Politician[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchPoliticians = async () => {
    try {
      setLoading(true)
      
      // Get the session token from Supabase
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      const response = await fetch('/api/politicians/list', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        // Don't show error for authentication issues
        if (response.status === 401 || response.status === 403) {
          console.log('User not authorized to fetch politicians')
          setPoliticians([])
          return
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to fetch politicians')
      }

      const data = await response.json()
      setPoliticians(data)
    } catch (error) {
      console.error('Error fetching politicians:', error)
      toast.error('Failed to load clients')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPoliticians()
  }, [])

  const togglePoliticianStatus = async (id: string, currentStatus: boolean) => {
    try {
      // Get the session token from Supabase
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      const response = await fetch(`/api/politicians/${id}/toggle-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ is_active: !currentStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      await fetchPoliticians()
      toast.success(`Client ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update client status')
    }
  }

  const deletePolitician = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      return
    }

    try {
      // Get the session token from Supabase
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      const response = await fetch(`/api/politicians/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete politician')
      }

      await fetchPoliticians()
      toast.success('Client deleted successfully')
    } catch (error) {
      console.error('Error deleting politician:', error)
      toast.error('Failed to delete client')
    }
  }

  const filteredPoliticians = politicians.filter(politician => 
    politician.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    politician.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    politician.constituency?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    politician.party?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getSubscriptionBadge = (tier?: string) => {
    switch (tier) {
      case 'enterprise':
        return <Badge variant="default" className="bg-purple-600">Enterprise</Badge>
      case 'pro':
        return <Badge variant="default">Professional</Badge>
      case 'basic':
        return <Badge variant="secondary">Basic</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getSubscriptionStatus = (expiresAt?: string) => {
    if (!expiresAt) return { status: 'unknown', variant: 'outline' as const }
    
    const now = new Date()
    const expiry = new Date(expiresAt)
    const daysRemaining = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysRemaining < 0) {
      return { status: 'Expired', variant: 'destructive' as const }
    } else if (daysRemaining <= 30) {
      return { status: `${daysRemaining} days left`, variant: 'outline' as const }
    } else {
      return { status: 'Active', variant: 'default' as const }
    }
  }

  return (
    <SuperAdminGuard>
      <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Client Management</h1>
            <p className="text-muted-foreground">
              Manage all politician accounts and subscriptions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <IconCrown className="h-3 w-3" />
              Super Admin Only
            </Badge>
            <Button onClick={() => router.push('/admin/clients/onboard')} className="gap-2">
              <IconPlus className="h-4 w-4" />
              Onboard New Client
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Clients</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{politicians.length}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Clients</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {politicians.filter(p => p.is_active).length}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Enterprise Tier</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-600">
                {politicians.filter(p => p.subscription_tier === 'enterprise').length}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Expiring Soon</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">
                {politicians.filter(p => {
                  if (!p.subscription_expires_at) return false
                  const daysRemaining = Math.floor((new Date(p.subscription_expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  return daysRemaining > 0 && daysRemaining <= 30
                }).length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Clients</CardTitle>
                <CardDescription>
                  View and manage all politician accounts
                </CardDescription>
              </div>
              <div className="relative w-full max-w-sm">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, party..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <TableLoader loading={loading} loadingText="Loading clients..." rows={5}>
              {filteredPoliticians.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {politicians.length === 0 
                      ? "No clients onboarded yet. Click 'Onboard New Client' to get started."
                      : "No clients match your search criteria."}
                  </p>
                </div>
              ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Politician</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Subscription</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPoliticians.map((politician) => {
                      const subStatus = getSubscriptionStatus(politician.subscription_expires_at)
                      return (
                        <TableRow key={politician.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={politician.profile_image} />
                                <AvatarFallback>
                                  {politician.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{politician.name}</p>
                                {politician.party && (
                                  <p className="text-sm text-muted-foreground">{politician.party}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{politician.email}</p>
                              <p className="text-muted-foreground">{politician.phone}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{politician.position || 'Not specified'}</p>
                              {politician.constituency && (
                                <p className="text-muted-foreground">{politician.constituency}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {politician.district && <p>{politician.district}</p>}
                              {politician.state && <p className="text-muted-foreground">{politician.state}</p>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {getSubscriptionBadge(politician.subscription_tier)}
                              <Badge variant={subStatus.variant} className="text-xs">
                                {subStatus.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant={politician.is_active ? "default" : "secondary"}
                              className="h-7 px-2 text-xs"
                              onClick={() => togglePoliticianStatus(politician.id, politician.is_active)}
                            >
                              {politician.is_active ? (
                                <>
                                  <IconCheck className="h-3 w-3 mr-1" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <IconX className="h-3 w-3 mr-1" />
                                  Inactive
                                </>
                              )}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              <IconCalendar className="inline h-3 w-3 mr-1" />
                              {new Date(politician.created_at).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => router.push(`/admin/clients/${politician.id}/edit`)}
                              >
                                <IconEdit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={() => deletePolitician(politician.id)}
                              >
                                <IconTrash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
              )}
            </TableLoader>
          </CardContent>
        </Card>
      </div>
    </SuperAdminGuard>
  )
}