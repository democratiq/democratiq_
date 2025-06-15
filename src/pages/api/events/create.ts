import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { getAuthContext } from '@/lib/api-auth-helpers'

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
    // Get auth context to determine politician_id
    const authContext = await getAuthContext(req)
    
    if (!authContext) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const {
      title,
      description,
      type,
      date,
      time,
      duration,
      location,
      expectedAttendees,
      priority,
      requiresApproval,
      isPublic,
      allowMediaCoverage,
      tags,
      organizer,
      budget,
      notes,
      aiPriorityScore
    } = req.body

    // Validate required fields
    if (!title || !type || !date || !time || !location) {
      return res.status(400).json({
        error: 'Missing required fields: title, type, date, time, location'
      })
    }

    // Validate event type
    const validEventTypes = [
      'town_hall', 'press_conference', 'community_event', 'rally', 
      'meeting', 'debate', 'interview', 'fundraiser', 'workshop', 'emergency_meeting'
    ]
    
    if (!validEventTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid event type'
      })
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent']
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({
        error: 'Invalid priority level'
      })
    }

    // Create event data
    const eventData = {
      title,
      description: description || null,
      type,
      date,
      time,
      duration: duration ? parseInt(duration) : 60,
      location,
      expected_attendees: expectedAttendees ? parseInt(expectedAttendees) : null,
      priority: priority || 'medium',
      requires_approval: requiresApproval !== false,
      is_public: isPublic !== false,
      allow_media_coverage: allowMediaCoverage || false,
      tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
      organizer: organizer || null,
      budget: budget || null,
      notes: notes || null,
      ai_priority_score: aiPriorityScore || null,
      status: requiresApproval !== false ? 'pending' : 'approved',
      approval_stage: requiresApproval !== false ? 'event_manager' : 'completed',
      politician_id: authContext.politicianId,
      created_by: authContext.userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Insert event into database
    const { data: event, error } = await supabase
      .from('events')
      .insert(eventData)
      .select()
      .single()

    if (error) {
      console.error('Error creating event:', error)
      return res.status(500).json({ error: 'Failed to create event' })
    }

    // If requires approval, create approval workflow entries
    if (requiresApproval !== false) {
      const approvalLevels = getApprovalLevels(type, priority)
      
      for (let i = 0; i < approvalLevels.length; i++) {
        const approvalData = {
          event_id: event.id,
          approval_level: i + 1,
          approver_role: approvalLevels[i],
          status: 'pending',
          required: true,
          politician_id: authContext.politicianId,
          created_at: new Date().toISOString()
        }

        await supabase.from('event_approvals').insert(approvalData)
      }
    }

    // Create calendar entry if user has calendar integration
    try {
      await createCalendarEntry(event, authContext.politicianId)
    } catch (calendarError) {
      console.error('Calendar integration error:', calendarError)
      // Don't fail the event creation if calendar sync fails
    }

    res.status(201).json(event)

  } catch (error) {
    console.error('Error creating event:', error)
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

function getApprovalLevels(eventType: string, priority: string): string[] {
  // Define approval workflows based on event type and priority
  const workflows: Record<string, string[]> = {
    'emergency_meeting': ['chief_of_staff'],
    'press_conference': ['event_manager', 'campaign_director', 'chief_of_staff'],
    'rally': ['event_manager', 'campaign_director', 'chief_of_staff'],
    'town_hall': ['event_manager', 'campaign_director'],
    'meeting': ['event_manager'],
    'community_event': ['event_manager'],
    'default': ['event_manager']
  }

  const levels = workflows[eventType] || workflows.default

  // Add additional approval levels for high priority events
  if (priority === 'urgent' && !levels.includes('chief_of_staff')) {
    levels.push('chief_of_staff')
  }

  return levels
}

async function createCalendarEntry(event: any, politicianId: string) {
  // Check if politician has Google Calendar integration
  const { data: integration } = await supabase
    .from('calendar_integrations')
    .select('*')
    .eq('politician_id', politicianId)
    .eq('provider', 'google')
    .eq('status', 'connected')
    .single()

  if (!integration) {
    return // No calendar integration available
  }

  // Create calendar event (this would integrate with actual Google Calendar API)
  const calendarEvent = {
    event_id: event.id,
    calendar_provider: 'google',
    external_event_id: `temp_${event.id}_${Date.now()}`, // Would be real Google event ID
    sync_status: 'pending',
    politician_id: politicianId,
    created_at: new Date().toISOString()
  }

  await supabase.from('calendar_events').insert(calendarEvent)
}