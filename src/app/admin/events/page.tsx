"use client"

import { useState, useEffect } from 'react'
import { AuthGuard } from '@/components/auth-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  IconCalendar,
  IconCalendarPlus,
  IconClock,
  IconMapPin,
  IconUsers,
  IconStar,
  IconEdit,
  IconTrash,
  IconEye,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconFilter,
  IconSearch,
  IconChevronDown,
  IconChevronUp
} from '@tabler/icons-react'
import { toast } from 'sonner'
import Link from 'next/link'

// Mock events data
const mockEvents = [
  {
    id: 1,
    title: 'Town Hall Meeting - Education Reform',
    type: 'Town Hall',
    date: '2024-01-25',
    time: '18:00',
    location: 'Central Community Center',
    attendees: 250,
    priority: 'high',
    status: 'approved',
    approvalStage: 'completed',
    aiPriorityScore: 8.5,
    description: 'Community discussion on proposed education reforms',
    organizer: 'Sarah Chen',
    approvedBy: ['Event Manager', 'Campaign Director', 'Chief of Staff'],
    estimatedImpact: 'High community engagement expected'
  },
  {
    id: 2,
    title: 'Press Conference - Infrastructure Announcement',
    type: 'Press Conference',
    date: '2024-01-28',
    time: '10:00',
    location: 'City Hall Press Room',
    attendees: 45,
    priority: 'high',
    status: 'pending',
    approvalStage: 'campaign_director',
    aiPriorityScore: 9.2,
    description: 'Announcing new infrastructure development project',
    organizer: 'Mike Johnson',
    approvedBy: ['Event Manager'],
    estimatedImpact: 'Major media coverage potential'
  },
  {
    id: 3,
    title: 'Community Breakfast - Senior Citizens',
    type: 'Community Event',
    date: '2024-01-30',
    time: '08:00',
    location: 'Golden Age Center',
    attendees: 80,
    priority: 'medium',
    status: 'approved',
    approvalStage: 'completed',
    aiPriorityScore: 6.8,
    description: 'Monthly breakfast with senior community members',
    organizer: 'Lisa Rodriguez',
    approvedBy: ['Event Manager'],
    estimatedImpact: 'Strong community relationships'
  },
  {
    id: 4,
    title: 'Emergency Response Meeting',
    type: 'Emergency Meeting',
    date: '2024-01-26',
    time: '14:00',
    location: 'Emergency Operations Center',
    attendees: 15,
    priority: 'urgent',
    status: 'approved',
    approvalStage: 'completed',
    aiPriorityScore: 9.8,
    description: 'Response coordination for recent flooding',
    organizer: 'Chief of Staff',
    approvedBy: ['Chief of Staff'],
    estimatedImpact: 'Critical emergency response'
  }
]

const mockCalendarSuggestions = [
  {
    date: '2024-01-27',
    time: '14:00',
    reason: 'Optimal time - no conflicts, travel buffer included',
    confidence: 95
  },
  {
    date: '2024-01-27',
    time: '16:00',
    reason: 'Good alternative - minor calendar gap',
    confidence: 80
  },
  {
    date: '2024-01-28',
    time: '15:00',
    reason: 'Available slot after press conference',
    confidence: 75
  }
]

export default function EventsPage() {
  const [events, setEvents] = useState(mockEvents)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [sortField, setSortField] = useState<string>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive'
      case 'high': return 'default'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'outline'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'default'
      case 'pending': return 'secondary'
      case 'rejected': return 'destructive'
      default: return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <IconCheck className="h-3 w-3" />
      case 'pending': return <IconClock className="h-3 w-3" />
      case 'rejected': return <IconX className="h-3 w-3" />
      default: return null
    }
  }

  const filteredEvents = events
    .filter(event => {
      const matchesSearch = searchQuery === '' || 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.type.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = filterStatus === 'all' || event.status === filterStatus
      const matchesPriority = filterPriority === 'all' || event.priority === filterPriority

      return matchesSearch && matchesStatus && matchesPriority
    })
    .sort((a, b) => {
      let aValue = a[sortField as keyof typeof a]
      let bValue = b[sortField as keyof typeof b]

      if (sortField === 'date') {
        aValue = new Date(a.date + ' ' + a.time).getTime()
        bValue = new Date(b.date + ' ' + b.time).getTime()
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

  const handleApproval = async (eventId: number, action: 'approve' | 'reject') => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setEvents(prev => prev.map(event => 
        event.id === eventId 
          ? { ...event, status: action === 'approve' ? 'approved' : 'rejected' }
          : event
      ))
      
      toast.success(`Event ${action}d successfully!`)
    } catch (error) {
      toast.error(`Failed to ${action} event`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Event Management</h1>
                <p className="text-muted-foreground">
                  Manage events, approvals, and calendar integrations
                </p>
              </div>
              <Link href="/admin/events/create">
                <Button className="gap-2">
                  <IconCalendarPlus className="h-4 w-4" />
                  Create Event
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <Tabs defaultValue="events" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="events">All Events</TabsTrigger>
              <TabsTrigger value="pending">Pending Approval</TabsTrigger>
              <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            </TabsList>

            <TabsContent value="events" className="space-y-6">
              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                    <div className="relative flex-1 max-w-sm">
                      <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search events..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>

                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filterPriority} onValueChange={setFilterPriority}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priority</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button variant="outline" onClick={() => {
                      setSearchQuery('')
                      setFilterStatus('all')
                      setFilterPriority('all')
                    }}>
                      <IconFilter className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Events Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Events</CardTitle>
                  <CardDescription>
                    Showing {filteredEvents.length} of {events.length} events
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event Details</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Location & Attendees</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>AI Score</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEvents.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{event.title}</div>
                              <div className="text-sm text-muted-foreground">{event.type}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Organized by {event.organizer}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <IconCalendar className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="text-sm">{new Date(event.date).toLocaleDateString()}</div>
                                <div className="text-xs text-muted-foreground">{event.time}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="flex items-center gap-2 text-sm">
                                <IconMapPin className="h-3 w-3 text-muted-foreground" />
                                {event.location}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <IconUsers className="h-3 w-3" />
                                {event.attendees} attendees
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getPriorityColor(event.priority)}>
                              {event.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <IconStar className="h-4 w-4 text-yellow-500" />
                              <span className="font-medium">{event.aiPriorityScore}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(event.status)} className="gap-1">
                              {getStatusIcon(event.status)}
                              {event.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm">
                                <IconEye className="h-3 w-3" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <IconEdit className="h-3 w-3" />
                              </Button>
                              {event.status === 'pending' && (
                                <>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleApproval(event.id, 'approve')}
                                    disabled={loading}
                                  >
                                    <IconCheck className="h-3 w-3 text-green-600" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleApproval(event.id, 'reject')}
                                    disabled={loading}
                                  >
                                    <IconX className="h-3 w-3 text-red-600" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pending" className="space-y-6">
              {/* Pending Approval Events */}
              <div className="grid gap-6">
                {events.filter(e => e.status === 'pending').map((event) => (
                  <Card key={event.id} className="border-orange-200">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {event.title}
                            <Badge variant={getPriorityColor(event.priority)}>
                              {event.priority}
                            </Badge>
                            <div className="flex items-center gap-1">
                              <IconStar className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm font-medium">{event.aiPriorityScore}</span>
                            </div>
                          </CardTitle>
                          <CardDescription>{event.description}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handleApproval(event.id, 'approve')}
                            disabled={loading}
                            className="gap-2"
                          >
                            <IconCheck className="h-4 w-4" />
                            Approve
                          </Button>
                          <Button 
                            variant="destructive"
                            onClick={() => handleApproval(event.id, 'reject')}
                            disabled={loading}
                            className="gap-2"
                          >
                            <IconX className="h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-medium">Event Details</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <IconCalendar className="h-3 w-3" />
                              {new Date(event.date).toLocaleDateString()} at {event.time}
                            </div>
                            <div className="flex items-center gap-2">
                              <IconMapPin className="h-3 w-3" />
                              {event.location}
                            </div>
                            <div className="flex items-center gap-2">
                              <IconUsers className="h-3 w-3" />
                              {event.attendees} expected attendees
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-medium">Approval Progress</h4>
                          <div className="space-y-1">
                            {event.approvedBy.map((approver, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <IconCheck className="h-3 w-3 text-green-600" />
                                <span>{approver}</span>
                              </div>
                            ))}
                            <div className="flex items-center gap-2 text-sm text-orange-600">
                              <IconClock className="h-3 w-3" />
                              <span>Pending: {event.approvalStage.replace('_', ' ')}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-medium">AI Assessment</h4>
                          <div className="text-sm">
                            <div className="mb-2">
                              <span className="font-medium">Impact: </span>
                              {event.estimatedImpact}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              AI suggests optimal timing and resource allocation based on historical data and current calendar.
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="calendar" className="space-y-6">
              {/* AI Calendar Suggestions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconCalendar className="h-5 w-5" />
                    AI-Powered Time Suggestions
                  </CardTitle>
                  <CardDescription>
                    Optimal time slots based on your calendar and event priority
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockCalendarSuggestions.map((suggestion, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="font-medium">{new Date(suggestion.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                            <div className="text-sm text-muted-foreground">{new Date(suggestion.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                          </div>
                          <div>
                            <div className="font-medium">{suggestion.time}</div>
                            <div className="text-sm text-muted-foreground">{suggestion.reason}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-sm font-medium">{suggestion.confidence}% match</div>
                            <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500" 
                                style={{ width: `${suggestion.confidence}%` }}
                              />
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            Select
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Calendar Integration Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Calendar Integration Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <IconCalendar className="h-8 w-8 text-blue-600" />
                        <div>
                          <div className="font-medium">Google Calendar</div>
                          <div className="text-sm text-muted-foreground">Last sync: 5 minutes ago</div>
                        </div>
                      </div>
                      <Badge variant="default">
                        <IconCheck className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <IconCalendar className="h-8 w-8 text-orange-600" />
                        <div>
                          <div className="font-medium">Outlook Calendar</div>
                          <div className="text-sm text-muted-foreground">Not connected</div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Connect
                      </Button>
                    </div>
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