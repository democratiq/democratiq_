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
    // Get auth context
    const authContext = await getAuthContext(req)
    
    if (!authContext) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const {
      eventType,
      duration = 60,
      preferredTimeStart = '09:00',
      preferredTimeEnd = '18:00',
      excludeWeekends = true,
      location,
      expectedAttendees,
      priority = 'medium'
    } = req.body

    // Get politician's calendar settings
    const { data: calendarSettings } = await supabase
      .from('calendar_settings')
      .select('*')
      .eq('politician_id', authContext.politicianId)
      .single()

    // Get existing events to check for conflicts
    const { data: existingEvents } = await supabase
      .from('events')
      .select('date, time, duration')
      .eq('politician_id', authContext.politicianId)
      .eq('status', 'approved')
      .gte('date', new Date().toISOString().split('T')[0])

    // Generate AI-powered time suggestions
    const suggestions = await generateTimeSuggestions({
      eventType,
      duration,
      preferredTimeStart,
      preferredTimeEnd,
      excludeWeekends,
      location,
      expectedAttendees,
      priority,
      existingEvents: existingEvents || [],
      calendarSettings
    })

    res.status(200).json({ suggestions })

  } catch (error) {
    console.error('Error generating calendar suggestions:', error)
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function generateTimeSuggestions({
  eventType,
  duration,
  preferredTimeStart,
  preferredTimeEnd,
  excludeWeekends,
  location,
  expectedAttendees,
  priority,
  existingEvents,
  calendarSettings
}: any) {
  const suggestions = []
  const bufferTime = calendarSettings?.buffer_time || 30 // minutes
  const travelTime = estimateTravelTime(location, expectedAttendees)

  // Generate suggestions for the next 14 days
  const startDate = new Date()
  const endDate = new Date()
  endDate.setDate(startDate.getDate() + 14)

  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    // Skip weekends if excluded
    if (excludeWeekends && (date.getDay() === 0 || date.getDay() === 6)) {
      continue
    }

    const dateStr = date.toISOString().split('T')[0]
    
    // Generate time slots for this date
    const timeSlots = generateTimeSlots(
      preferredTimeStart,
      preferredTimeEnd,
      duration,
      bufferTime
    )

    for (const timeSlot of timeSlots) {
      const suggestion = await evaluateTimeSlot({
        date: dateStr,
        time: timeSlot,
        duration,
        eventType,
        location,
        expectedAttendees,
        priority,
        existingEvents,
        travelTime,
        bufferTime
      })

      if (suggestion.score > 50) { // Only include viable suggestions
        suggestions.push(suggestion)
      }
    }
  }

  // Sort by score and return top 10
  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
}

function generateTimeSlots(startTime: string, endTime: string, duration: number, bufferTime: number): string[] {
  const slots = []
  const start = parseTime(startTime)
  const end = parseTime(endTime)
  const slotDuration = duration + bufferTime

  for (let current = start; current + slotDuration <= end; current += 30) {
    const hours = Math.floor(current / 60)
    const minutes = current % 60
    slots.push(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`)
  }

  return slots
}

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

async function evaluateTimeSlot({
  date,
  time,
  duration,
  eventType,
  location,
  expectedAttendees,
  priority,
  existingEvents,
  travelTime,
  bufferTime
}: any) {
  let score = 100
  let reasons = []
  let conflicts = []

  // Check for direct conflicts
  const eventDateTime = new Date(`${date}T${time}`)
  const eventEndTime = new Date(eventDateTime.getTime() + duration * 60000)

  for (const existingEvent of existingEvents) {
    const existingStart = new Date(`${existingEvent.date}T${existingEvent.time}`)
    const existingEnd = new Date(existingStart.getTime() + (existingEvent.duration || 60) * 60000)

    // Add buffer time to existing events
    existingStart.setMinutes(existingStart.getMinutes() - bufferTime)
    existingEnd.setMinutes(existingEnd.getMinutes() + bufferTime)

    if (eventDateTime < existingEnd && eventEndTime > existingStart) {
      score -= 50
      conflicts.push('Direct scheduling conflict')
      break
    }
  }

  // Time of day scoring
  const hour = parseInt(time.split(':')[0])
  
  // Optimal time ranges based on event type
  const optimalTimes: Record<string, { start: number, end: number, bonus: number }> = {
    'press_conference': { start: 9, end: 11, bonus: 20 },
    'town_hall': { start: 18, end: 20, bonus: 15 },
    'meeting': { start: 10, end: 16, bonus: 10 },
    'community_event': { start: 14, end: 18, bonus: 15 },
    'emergency_meeting': { start: 8, end: 22, bonus: 0 } // Flexible timing
  }

  const optimal = optimalTimes[eventType] || { start: 9, end: 17, bonus: 5 }
  
  if (hour >= optimal.start && hour <= optimal.end) {
    score += optimal.bonus
    reasons.push(`Optimal time for ${eventType.replace('_', ' ')}`)
  } else {
    score -= 10
  }

  // Day of week scoring
  const dayOfWeek = new Date(date).getDay()
  
  if (eventType === 'press_conference' && (dayOfWeek >= 2 && dayOfWeek <= 4)) {
    score += 10
    reasons.push('Weekday timing good for media coverage')
  }
  
  if (eventType === 'community_event' && (dayOfWeek === 6 || dayOfWeek === 0)) {
    score += 15
    reasons.push('Weekend timing increases community attendance')
  }

  // Audience size considerations
  if (expectedAttendees) {
    const attendees = parseInt(expectedAttendees)
    
    if (attendees > 100 && hour >= 18) {
      score += 10
      reasons.push('Evening timing good for large events')
    }
    
    if (attendees < 20 && hour >= 9 && hour <= 11) {
      score += 5
      reasons.push('Morning timing efficient for small meetings')
    }
  }

  // Travel time considerations
  if (travelTime > 30) {
    score -= 5
    reasons.push('Consider travel time to location')
  }

  // Priority-based scoring
  const priorityBonus = {
    'urgent': 0, // Urgent events should take any available slot
    'high': 5,
    'medium': 10,
    'low': 15
  }
  
  score += priorityBonus[priority] || 0

  // Advanced date considerations
  const today = new Date()
  const eventDate = new Date(date)
  const daysAhead = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (daysAhead < 2 && priority !== 'urgent') {
    score -= 20
    reasons.push('Short notice may reduce attendance')
  }

  if (daysAhead > 7 && daysAhead <= 14) {
    score += 10
    reasons.push('Good advance notice for planning')
  }

  // Generate reason text
  let reasonText = 'Available time slot'
  if (reasons.length > 0) {
    reasonText = reasons.join(', ')
  }
  
  if (conflicts.length > 0) {
    reasonText += ` (${conflicts.join(', ')})`
  }

  return {
    date,
    time,
    score: Math.max(0, Math.min(100, score)),
    reason: reasonText,
    conflicts,
    confidence: Math.max(0, Math.min(100, score))
  }
}

function estimateTravelTime(location: string, expectedAttendees: number): number {
  // Simple travel time estimation
  // In a real implementation, this would use Google Maps API or similar
  
  if (!location) return 0
  
  // Estimate based on location type
  const locationLower = location.toLowerCase()
  
  if (locationLower.includes('city hall') || locationLower.includes('downtown')) {
    return expectedAttendees > 100 ? 45 : 30
  }
  
  if (locationLower.includes('center') || locationLower.includes('venue')) {
    return 20
  }
  
  if (locationLower.includes('remote') || locationLower.includes('virtual')) {
    return 0
  }
  
  return 15 // Default travel time
}