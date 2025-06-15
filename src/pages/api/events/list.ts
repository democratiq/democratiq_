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
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
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
      status, 
      priority, 
      type, 
      limit = '50', 
      offset = '0',
      sortBy = 'date',
      sortOrder = 'asc'
    } = req.query

    // Build query
    let query = supabase
      .from('events')
      .select(`
        *,
        event_approvals (
          approval_level,
          approver_role,
          status,
          approved_by,
          approved_at,
          comments
        )
      `)
      .eq('politician_id', authContext.politicianId)

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (priority && priority !== 'all') {
      query = query.eq('priority', priority)
    }

    if (type && type !== 'all') {
      query = query.eq('type', type)
    }

    // Apply sorting
    const validSortFields = ['date', 'created_at', 'title', 'priority', 'ai_priority_score']
    const sortField = validSortFields.includes(sortBy as string) ? sortBy as string : 'date'
    const order = sortOrder === 'desc' ? false : true

    query = query.order(sortField, { ascending: order })

    // Apply pagination
    const limitNum = Math.min(parseInt(limit as string), 100) // Max 100 items
    const offsetNum = parseInt(offset as string)

    query = query.range(offsetNum, offsetNum + limitNum - 1)

    const { data: events, error } = await query

    if (error) {
      console.error('Error fetching events:', error)
      return res.status(500).json({ error: 'Failed to fetch events' })
    }

    // Process events to add computed fields
    const processedEvents = events?.map(event => ({
      ...event,
      datetime: `${event.date}T${event.time}`,
      approvedBy: event.event_approvals
        ?.filter((approval: any) => approval.status === 'approved')
        ?.map((approval: any) => approval.approver_role) || [],
      currentApprovalStage: getCurrentApprovalStage(event.event_approvals),
      approvalProgress: calculateApprovalProgress(event.event_approvals)
    }))

    // Get total count for pagination
    const { count } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('politician_id', authContext.politicianId)

    res.status(200).json({
      events: processedEvents,
      pagination: {
        total: count || 0,
        limit: limitNum,
        offset: offsetNum,
        hasMore: (offsetNum + limitNum) < (count || 0)
      }
    })

  } catch (error) {
    console.error('Error fetching events:', error)
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

function getCurrentApprovalStage(approvals: any[]): string {
  if (!approvals || approvals.length === 0) {
    return 'completed'
  }

  // Find the first pending approval
  const pendingApproval = approvals
    .sort((a, b) => a.approval_level - b.approval_level)
    .find(approval => approval.status === 'pending')

  if (!pendingApproval) {
    return 'completed'
  }

  return pendingApproval.approver_role
}

function calculateApprovalProgress(approvals: any[]): number {
  if (!approvals || approvals.length === 0) {
    return 100
  }

  const totalLevels = approvals.length
  const approvedLevels = approvals.filter(approval => approval.status === 'approved').length

  return Math.round((approvedLevels / totalLevels) * 100)
}