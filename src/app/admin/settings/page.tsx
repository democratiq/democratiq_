"use client"

import { useState, useEffect } from 'react'
import { AuthGuard } from '@/components/auth-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  IconSettings,
  IconCalendar,
  IconUsers,
  IconNotification,
  IconShield,
  IconRobot,
  IconCheck,
  IconX,
  IconExternalLink,
  IconRefresh,
  IconClock,
  IconStar,
  IconAlertTriangle,
  IconEye,
  IconEdit,
  IconTrash
} from '@tabler/icons-react'
import { toast } from 'sonner'

// Calendar integration interface
interface CalendarIntegration {
  id?: string
  provider: string
  status: 'connected' | 'disconnected' | 'error'
  email?: string | null
  calendarsConnected: number
  lastSync?: string | null
  tokenExpiresAt?: string | null
  userProfile?: any
  calendarList?: any[]
  needsReauth?: boolean
}

const mockApprovalWorkflows = [
  {
    id: 1,
    name: 'High-Profile Public Events',
    levels: ['Event Manager', 'Campaign Director', 'Chief of Staff'],
    eventTypes: ['Rally', 'Press Conference', 'Public Appearance'],
    autoApprove: false,
    isActive: true
  },
  {
    id: 2,
    name: 'Standard Meetings',
    levels: ['Event Manager'],
    eventTypes: ['Team Meeting', 'Stakeholder Meeting'],
    autoApprove: true,
    isActive: true
  },
  {
    id: 3,
    name: 'Emergency Events',
    levels: ['Chief of Staff'],
    eventTypes: ['Crisis Response', 'Emergency Meeting'],
    autoApprove: false,
    isActive: true
  }
]

const mockAISettings = {
  eventPrioritization: {
    enabled: true,
    factors: ['impact_score', 'audience_size', 'media_coverage', 'strategic_importance'],
    threshold: 7.5
  },
  timeOptimization: {
    enabled: true,
    workingHours: { start: '09:00', end: '18:00' },
    bufferTime: 30,
    travelTime: true
  },
  autoSuggestions: {
    enabled: true,
    conflictResolution: true,
    followUpEvents: true
  }
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [calendarIntegrations, setCalendarIntegrations] = useState<CalendarIntegration[]>([])
  const [aiSettings, setAISettings] = useState(mockAISettings)
  const [approvalWorkflows, setApprovalWorkflows] = useState(mockApprovalWorkflows)
  const [statusLoading, setStatusLoading] = useState(true)

  useEffect(() => {
    fetchCalendarStatus()
    
    // Check for OAuth callback results in URL params
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const error = urlParams.get('error')
    const calendars = urlParams.get('calendars')

    if (success === 'calendar_connected') {
      toast.success(`Google Calendar connected successfully! ${calendars} calendars found.`)
      // Clear URL params
      window.history.replaceState({}, '', '/admin/settings')
      // Refresh status
      setTimeout(fetchCalendarStatus, 1000)
    } else if (error) {
      const errorMessages: Record<string, string> = {
        oauth_denied: 'Google Calendar access was denied',
        missing_parameters: 'Invalid OAuth response',
        invalid_state: 'Security validation failed',
        expired_state: 'OAuth session expired',
        no_access_token: 'Failed to get access token',
        database_error: 'Failed to save calendar settings',
        callback_error: 'OAuth callback error'
      }
      toast.error(errorMessages[error] || 'Failed to connect Google Calendar')
      // Clear URL params
      window.history.replaceState({}, '', '/admin/settings')
    }
  }, [])

  const fetchCalendarStatus = async () => {
    try {
      const { getAuthHeaders } = await import('@/lib/client-auth')
      const authHeaders = await getAuthHeaders()
      
      const response = await fetch('/api/calendar/status', {
        headers: authHeaders
      })
      
      if (response.ok) {
        const data = await response.json()
        setCalendarIntegrations(data.integrations)
      } else {
        console.error('Failed to fetch calendar status')
      }
    } catch (error) {
      console.error('Error fetching calendar status:', error)
    } finally {
      setStatusLoading(false)
    }
  }

  const handleGoogleConnect = async () => {
    setLoading(true)
    try {
      const { getAuthHeaders } = await import('@/lib/client-auth')
      const authHeaders = await getAuthHeaders()
      
      const response = await fetch('/api/auth/google/initiate', {
        method: 'POST',
        headers: authHeaders
      })
      
      if (response.ok) {
        const data = await response.json()
        // Redirect to Google OAuth
        window.location.href = data.authUrl
      } else {
        throw new Error('Failed to initiate OAuth')
      }
    } catch (error) {
      console.error('Error initiating Google OAuth:', error)
      toast.error('Failed to connect Google Calendar')
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async (provider: string) => {
    setLoading(true)
    try {
      const { getAuthHeaders } = await import('@/lib/client-auth')
      const authHeaders = await getAuthHeaders()
      
      const response = await fetch('/api/auth/google/disconnect', {
        method: 'POST',
        headers: authHeaders
      })
      
      if (response.ok) {
        toast.success(`${provider} disconnected successfully!`)
        // Refresh calendar status
        fetchCalendarStatus()
      } else {
        throw new Error('Failed to disconnect')
      }
    } catch (error) {
      console.error('Error disconnecting calendar:', error)
      toast.error(`Failed to disconnect ${provider}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async (provider: string) => {
    setLoading(true)
    try {
      // For now, just refresh the status which will validate tokens
      await fetchCalendarStatus()
      toast.success(`${provider} status refreshed!`)
    } catch (error) {
      console.error('Error syncing calendar:', error)
      toast.error(`Failed to sync ${provider}`)
    } finally {
      setLoading(false)
    }
  }

  const toggleWorkflow = (workflowId: number) => {
    setApprovalWorkflows(prev => prev.map(workflow => 
      workflow.id === workflowId 
        ? { ...workflow, isActive: !workflow.isActive }
        : workflow
    ))
  }

  const updateAISetting = (category: string, setting: string, value: any) => {
    setAISettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [setting]: value
      }
    }))
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground">
                  Configure calendar integrations, event automation, and approval workflows
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <Tabs defaultValue="calendar" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="calendar">Calendar Integration</TabsTrigger>
              <TabsTrigger value="events">Event Automation</TabsTrigger>
              <TabsTrigger value="approvals">Approval Workflows</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="general">General</TabsTrigger>
            </TabsList>

            <TabsContent value="calendar" className="space-y-6">
              {/* Calendar Integrations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconCalendar className="h-5 w-5" />
                    Calendar Integrations
                  </CardTitle>
                  <CardDescription>
                    Connect your calendars to sync events and enable smart scheduling
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {statusLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-muted-foreground">Loading calendar integrations...</p>
                    </div>
                  ) : (
                    calendarIntegrations.map((calendar, index) => {
                      const displayName = calendar.provider === 'google' ? 'Google Calendar' : 
                                         calendar.provider === 'outlook' ? 'Outlook Calendar' : 
                                         calendar.provider

                      return (
                        <div key={calendar.id || index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                              <IconCalendar className="h-6 w-6" />
                            </div>
                            <div>
                              <div className="font-medium">{displayName}</div>
                              {calendar.status === 'connected' ? (
                                <div className="text-sm text-muted-foreground">
                                  Connected as {calendar.email} • {calendar.calendarsConnected} calendars
                                </div>
                              ) : calendar.status === 'error' ? (
                                <div className="text-sm text-red-600">
                                  Connection error {calendar.needsReauth ? '- requires re-authentication' : ''}
                                </div>
                              ) : (
                                <div className="text-sm text-muted-foreground">Not connected</div>
                              )}
                              {calendar.lastSync && (
                                <div className="text-xs text-muted-foreground">
                                  Last sync: {new Date(calendar.lastSync).toLocaleString()}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              calendar.status === 'connected' ? 'default' : 
                              calendar.status === 'error' ? 'destructive' : 'secondary'
                            }>
                              {calendar.status === 'connected' ? (
                                <><IconCheck className="h-3 w-3 mr-1" /> Connected</>
                              ) : calendar.status === 'error' ? (
                                <><IconAlertTriangle className="h-3 w-3 mr-1" /> Error</>
                              ) : (
                                <><IconX className="h-3 w-3 mr-1" /> Disconnected</>
                              )}
                            </Badge>
                            {calendar.status === 'connected' ? (
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSync(calendar.provider)}
                                  disabled={loading}
                                >
                                  <IconRefresh className="h-4 w-4 mr-1" />
                                  Refresh
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDisconnect(calendar.provider)}
                                  disabled={loading}
                                >
                                  Disconnect
                                </Button>
                              </div>
                            ) : (
                              <Button
                                onClick={calendar.provider === 'google' ? handleGoogleConnect : undefined}
                                disabled={loading || calendar.provider !== 'google'}
                                className="gap-2"
                              >
                                <IconExternalLink className="h-4 w-4" />
                                {calendar.provider === 'google' ? 'Connect' : 'Coming Soon'}
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </CardContent>
              </Card>

              {/* Sync Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Sync Settings</CardTitle>
                  <CardDescription>
                    Configure how and when your calendars sync
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-sync enabled</Label>
                      <p className="text-sm text-muted-foreground">Automatically sync calendars every hour</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Two-way sync</Label>
                      <p className="text-sm text-muted-foreground">Changes in external calendars update the platform</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Conflict detection</Label>
                      <p className="text-sm text-muted-foreground">Alert when scheduling conflicts are detected</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="space-y-2">
                    <Label>Sync frequency</Label>
                    <Select defaultValue="60">
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">Every 15 minutes</SelectItem>
                        <SelectItem value="30">Every 30 minutes</SelectItem>
                        <SelectItem value="60">Every hour</SelectItem>
                        <SelectItem value="240">Every 4 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="events" className="space-y-6">
              {/* AI Event Automation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconRobot className="h-5 w-5" />
                    AI Event Automation
                  </CardTitle>
                  <CardDescription>
                    Configure AI-powered event prioritization and scheduling optimization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Event Prioritization</Label>
                        <p className="text-sm text-muted-foreground">AI suggests event priority based on impact factors</p>
                      </div>
                      <Switch 
                        checked={aiSettings.eventPrioritization.enabled}
                        onCheckedChange={(checked) => updateAISetting('eventPrioritization', 'enabled', checked)}
                      />
                    </div>
                    
                    {aiSettings.eventPrioritization.enabled && (
                      <div className="ml-4 space-y-3 p-4 bg-muted/30 rounded-lg">
                        <div className="space-y-2">
                          <Label>Priority Factors</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {aiSettings.eventPrioritization.factors.map((factor) => (
                              <div key={factor} className="flex items-center gap-2">
                                <IconCheck className="h-4 w-4 text-green-600" />
                                <span className="text-sm capitalize">{factor.replace('_', ' ')}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Priority Threshold (1-10)</Label>
                          <Input 
                            type="number" 
                            min="1" 
                            max="10" 
                            step="0.5"
                            value={aiSettings.eventPrioritization.threshold}
                            onChange={(e) => updateAISetting('eventPrioritization', 'threshold', parseFloat(e.target.value))}
                            className="w-[120px]"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Time Optimization</Label>
                        <p className="text-sm text-muted-foreground">Suggest optimal times considering travel and preferences</p>
                      </div>
                      <Switch 
                        checked={aiSettings.timeOptimization.enabled}
                        onCheckedChange={(checked) => updateAISetting('timeOptimization', 'enabled', checked)}
                      />
                    </div>

                    {aiSettings.timeOptimization.enabled && (
                      <div className="ml-4 space-y-3 p-4 bg-muted/30 rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Working Hours Start</Label>
                            <Input 
                              type="time" 
                              value={aiSettings.timeOptimization.workingHours.start}
                              onChange={(e) => updateAISetting('timeOptimization', 'workingHours', {
                                ...aiSettings.timeOptimization.workingHours,
                                start: e.target.value
                              })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Working Hours End</Label>
                            <Input 
                              type="time" 
                              value={aiSettings.timeOptimization.workingHours.end}
                              onChange={(e) => updateAISetting('timeOptimization', 'workingHours', {
                                ...aiSettings.timeOptimization.workingHours,
                                end: e.target.value
                              })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Buffer Time (minutes)</Label>
                          <Input 
                            type="number" 
                            min="0" 
                            max="120"
                            value={aiSettings.timeOptimization.bufferTime}
                            onChange={(e) => updateAISetting('timeOptimization', 'bufferTime', parseInt(e.target.value))}
                            className="w-[120px]"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Include Travel Time</Label>
                            <p className="text-sm text-muted-foreground">Factor in travel time between locations</p>
                          </div>
                          <Switch 
                            checked={aiSettings.timeOptimization.travelTime}
                            onCheckedChange={(checked) => updateAISetting('timeOptimization', 'travelTime', checked)}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Auto Suggestions</Label>
                        <p className="text-sm text-muted-foreground">Automatically suggest follow-up events and conflict resolutions</p>
                      </div>
                      <Switch 
                        checked={aiSettings.autoSuggestions.enabled}
                        onCheckedChange={(checked) => updateAISetting('autoSuggestions', 'enabled', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="approvals" className="space-y-6">
              {/* Approval Workflows */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconShield className="h-5 w-5" />
                    Approval Workflows
                  </CardTitle>
                  <CardDescription>
                    Configure multi-level approval processes for different event types
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {approvalWorkflows.map((workflow) => (
                      <div key={workflow.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium">{workflow.name}</h3>
                            <Badge variant={workflow.isActive ? 'default' : 'secondary'}>
                              {workflow.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch 
                              checked={workflow.isActive}
                              onCheckedChange={() => toggleWorkflow(workflow.id)}
                            />
                            <Button variant="outline" size="sm">
                              <IconEdit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <IconTrash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <Label className="text-xs text-muted-foreground">APPROVAL LEVELS</Label>
                            <div className="mt-1">
                              {workflow.levels.map((level, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <span className="text-xs bg-muted px-2 py-1 rounded">{index + 1}</span>
                                  <span>{level}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-xs text-muted-foreground">EVENT TYPES</Label>
                            <div className="mt-1 space-y-1">
                              {workflow.eventTypes.map((type, index) => (
                                <Badge key={index} variant="outline" className="text-xs mr-1">
                                  {type}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-xs text-muted-foreground">AUTO-APPROVE</Label>
                            <div className="mt-1">
                              <Badge variant={workflow.autoApprove ? 'default' : 'secondary'}>
                                {workflow.autoApprove ? 'Enabled' : 'Disabled'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <Button variant="outline" className="w-full">
                      <IconRobot className="h-4 w-4 mr-2" />
                      Add New Workflow
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconNotification className="h-5 w-5" />
                    Notification Settings
                  </CardTitle>
                  <CardDescription>
                    Configure when and how you receive event notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive email alerts for events and approvals</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive SMS for urgent events</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Browser and mobile push notifications</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>
                    Basic platform and account settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Time Zone</Label>
                    <Select defaultValue="America/New_York">
                      <SelectTrigger className="w-[300px]">
                        <SelectValue placeholder="Select time zone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                        <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Default Event Duration</Label>
                    <Select defaultValue="60">
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="90">1.5 hours</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthGuard>
  )
}