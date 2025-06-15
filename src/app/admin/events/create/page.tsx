"use client"

import { useState, useEffect } from 'react'
import { AuthGuard } from '@/components/auth-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  IconCalendar,
  IconClock,
  IconMapPin,
  IconUsers,
  IconStar,
  IconRobot,
  IconAlertTriangle,
  IconCheck,
  IconArrowLeft,
  IconDeviceFloppy,
  IconEye,
  IconBrain,
  IconTarget,
  IconTrendingUp,
  IconCalendarEvent
} from '@tabler/icons-react'
import { toast } from 'sonner'
import Link from 'next/link'

// Mock AI suggestions data
const mockAISuggestions = {
  timeSlots: [
    {
      date: '2024-01-27',
      time: '14:00',
      score: 95,
      reason: 'Optimal engagement time, no conflicts, includes travel buffer',
      conflicts: []
    },
    {
      date: '2024-01-27',
      time: '16:00',
      score: 88,
      reason: 'Good alternative slot, minor calendar gap',
      conflicts: ['15 min buffer from previous meeting']
    },
    {
      date: '2024-01-28',
      time: '10:00',
      score: 82,
      reason: 'Morning slot, good for press events',
      conflicts: []
    }
  ],
  priorityFactors: {
    audienceSize: 8.5,
    mediaImpact: 9.2,
    strategicImportance: 8.8,
    communityEngagement: 7.9,
    overallScore: 8.6
  },
  recommendations: [
    'Consider scheduling 2 hours before sunset for optimal lighting if outdoor event',
    'Recommend sending invitations 2 weeks in advance for this event type',
    'Similar events show 15% higher attendance on weekdays',
    'Location has excellent public transport access - mention in invitations'
  ]
}

const eventTypes = [
  'Town Hall',
  'Press Conference',
  'Community Event',
  'Rally',
  'Meeting',
  'Debate',
  'Interview',
  'Fundraiser',
  'Workshop',
  'Emergency Meeting'
]

const priorities = [
  { value: 'low', label: 'Low Priority', color: 'outline' },
  { value: 'medium', label: 'Medium Priority', color: 'secondary' },
  { value: 'high', label: 'High Priority', color: 'default' },
  { value: 'urgent', label: 'Urgent', color: 'destructive' }
]

export default function CreateEventPage() {
  const [loading, setLoading] = useState(false)
  const [aiSuggestions, setAISuggestions] = useState(mockAISuggestions)
  const [showAISuggestions, setShowAISuggestions] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    date: '',
    time: '',
    duration: '60',
    location: '',
    expectedAttendees: '',
    priority: 'medium',
    requiresApproval: true,
    isPublic: true,
    allowMediaCoverage: false,
    tags: '',
    organizer: '',
    budget: '',
    notes: ''
  })

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Trigger AI analysis when key fields change
    if (['type', 'expectedAttendees', 'location'].includes(field)) {
      generateAISuggestions()
    }
  }

  const generateAISuggestions = async () => {
    if (!formData.type || !formData.expectedAttendees) return
    
    setLoading(true)
    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Update AI suggestions based on form data
      const newScore = Math.random() * 2 + 7 // 7-9 range
      setAISuggestions(prev => ({
        ...prev,
        priorityFactors: {
          ...prev.priorityFactors,
          overallScore: parseFloat(newScore.toFixed(1))
        }
      }))
    } catch (error) {
      console.error('AI analysis failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.title || !formData.type || !formData.date || !formData.time || !formData.location) {
        toast.error('Please fill in all required fields')
        return
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success('Event created successfully!')
      
      // Redirect to events page
      window.location.href = '/admin/events'
    } catch (error) {
      toast.error('Failed to create event. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const selectAISuggestion = (suggestion: typeof mockAISuggestions.timeSlots[0]) => {
    setFormData(prev => ({
      ...prev,
      date: suggestion.date,
      time: suggestion.time
    }))
    toast.success('AI suggestion applied!')
  }

  const getPriorityColor = (priority: string) => {
    const p = priorities.find(p => p.value === priority)
    return p ? p.color : 'outline'
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/admin/events">
                  <Button variant="outline" size="icon">
                    <IconArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold">Create New Event</h1>
                  <p className="text-muted-foreground">
                    Plan and schedule events with AI-powered optimization
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setShowAISuggestions(!showAISuggestions)}>
                  <IconBrain className="h-4 w-4 mr-2" />
                  {showAISuggestions ? 'Hide' : 'Show'} AI Suggestions
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Event Details</CardTitle>
                    <CardDescription>
                      Basic information about your event
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Event Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="Enter event title"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Describe the event purpose and agenda"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="type">Event Type *</Label>
                        <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select event type" />
                          </SelectTrigger>
                          <SelectContent>
                            {eventTypes.map((type) => (
                              <SelectItem key={type} value={type.toLowerCase().replace(' ', '_')}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            {priorities.map((priority) => (
                              <SelectItem key={priority.value} value={priority.value}>
                                {priority.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="organizer">Organizer</Label>
                      <Input
                        id="organizer"
                        value={formData.organizer}
                        onChange={(e) => handleInputChange('organizer', e.target.value)}
                        placeholder="Event organizer name"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Date, Time & Location */}
                <Card>
                  <CardHeader>
                    <CardTitle>Schedule & Location</CardTitle>
                    <CardDescription>
                      When and where the event will take place
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">Date *</Label>
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => handleInputChange('date', e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="time">Time *</Label>
                        <Input
                          id="time"
                          type="time"
                          value={formData.time}
                          onChange={(e) => handleInputChange('time', e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="duration">Duration (minutes)</Label>
                        <Select value={formData.duration} onValueChange={(value) => handleInputChange('duration', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Duration" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="60">1 hour</SelectItem>
                            <SelectItem value="90">1.5 hours</SelectItem>
                            <SelectItem value="120">2 hours</SelectItem>
                            <SelectItem value="180">3 hours</SelectItem>
                            <SelectItem value="240">4 hours</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location *</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="Event venue or address"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expectedAttendees">Expected Attendees</Label>
                        <Input
                          id="expectedAttendees"
                          type="number"
                          value={formData.expectedAttendees}
                          onChange={(e) => handleInputChange('expectedAttendees', e.target.value)}
                          placeholder="Number of expected attendees"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="budget">Budget (optional)</Label>
                        <Input
                          id="budget"
                          value={formData.budget}
                          onChange={(e) => handleInputChange('budget', e.target.value)}
                          placeholder="Event budget"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Event Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Event Settings</CardTitle>
                    <CardDescription>
                      Configure event visibility and approval requirements
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Requires Approval</Label>
                        <p className="text-sm text-muted-foreground">Event must be approved before confirmation</p>
                      </div>
                      <Switch 
                        checked={formData.requiresApproval}
                        onCheckedChange={(checked) => handleInputChange('requiresApproval', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Public Event</Label>
                        <p className="text-sm text-muted-foreground">Event is visible to the public</p>
                      </div>
                      <Switch 
                        checked={formData.isPublic}
                        onCheckedChange={(checked) => handleInputChange('isPublic', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Allow Media Coverage</Label>
                        <p className="text-sm text-muted-foreground">Media is welcome to cover this event</p>
                      </div>
                      <Switch 
                        checked={formData.allowMediaCoverage}
                        onCheckedChange={(checked) => handleInputChange('allowMediaCoverage', checked)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags (comma-separated)</Label>
                      <Input
                        id="tags"
                        value={formData.tags}
                        onChange={(e) => handleInputChange('tags', e.target.value)}
                        placeholder="education, healthcare, infrastructure"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Additional Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        placeholder="Any additional information or special requirements"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Submit Buttons */}
                <div className="flex gap-3">
                  <Button type="submit" disabled={loading} className="gap-2">
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <IconDeviceFloppy className="h-4 w-4" />
                        Create Event
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" disabled={loading}>
                    <IconEye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Link href="/admin/events">
                    <Button type="button" variant="outline" disabled={loading}>
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </div>

            {/* AI Suggestions Sidebar */}
            {showAISuggestions && (
              <div className="space-y-6">
                {/* AI Priority Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconRobot className="h-5 w-5" />
                      AI Priority Analysis
                    </CardTitle>
                    <CardDescription>
                      AI-powered event impact assessment
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-2">
                        {aiSuggestions.priorityFactors.overallScore}/10
                      </div>
                      <div className="text-sm text-muted-foreground">Overall Impact Score</div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Audience Size</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500" 
                              style={{ width: `${aiSuggestions.priorityFactors.audienceSize * 10}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{aiSuggestions.priorityFactors.audienceSize}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm">Media Impact</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500" 
                              style={{ width: `${aiSuggestions.priorityFactors.mediaImpact * 10}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{aiSuggestions.priorityFactors.mediaImpact}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm">Strategic Importance</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-orange-500" 
                              style={{ width: `${aiSuggestions.priorityFactors.strategicImportance * 10}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{aiSuggestions.priorityFactors.strategicImportance}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm">Community Engagement</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-purple-500" 
                              style={{ width: `${aiSuggestions.priorityFactors.communityEngagement * 10}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{aiSuggestions.priorityFactors.communityEngagement}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Time Suggestions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconCalendarEvent className="h-5 w-5" />
                      Optimal Time Slots
                    </CardTitle>
                    <CardDescription>
                      AI-recommended scheduling options
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {aiSuggestions.timeSlots.map((slot, index) => (
                      <div key={index} className="p-3 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              {new Date(slot.date).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric' 
                              })} at {slot.time}
                            </div>
                            <div className="text-sm text-muted-foreground">{slot.reason}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-bold text-green-600">{slot.score}%</div>
                            <div className="text-xs text-muted-foreground">match</div>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => selectAISuggestion(slot)}
                        >
                          Use This Time
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* AI Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconTarget className="h-5 w-5" />
                      AI Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {aiSuggestions.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <IconCheck className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}