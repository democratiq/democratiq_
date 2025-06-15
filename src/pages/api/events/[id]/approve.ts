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
    const { id } = req.query
    const { action, comments } = req.body // action: 'approve' | 'reject'

    // Get auth context
    const authContext = await getAuthContext(req)
    
    if (!authContext) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!id || !action) {
      return res.status(400).json({ error: 'Missing event ID or action' })
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be approve or reject' })
    }

    // Get the event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .eq('politician_id', authContext.politicianId)
      .single()

    if (eventError || !event) {
      return res.status(404).json({ error: 'Event not found' })
    }

    // Get current user's role to determine approval authority
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', authContext.userId)
      .single()

    if (!userProfile) {
      return res.status(403).json({ error: 'User profile not found' })
    }

    // Get pending approvals for this event
    const { data: approvals, error: approvalsError } = await supabase
      .from('event_approvals')
      .select('*')
      .eq('event_id', id)
      .order('approval_level')

    if (approvalsError) {
      return res.status(500).json({ error: 'Failed to fetch approvals' })
    }

    // Check if user has authority to approve/reject at current stage
    const userRole = mapUserRoleToApproverRole(userProfile.role)
    const currentApproval = approvals?.find(approval => 
      approval.approver_role === userRole && approval.status === 'pending'
    )

    if (!currentApproval) {
      return res.status(403).json({ 
        error: 'You do not have authority to approve/reject this event at the current stage' 
      })
    }

    // Update the approval
    const { error: updateError } = await supabase
      .from('event_approvals')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        approved_by: authContext.userId,
        approved_at: new Date().toISOString(),
        comments: comments || null
      })
      .eq('id', currentApproval.id)

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update approval' })
    }

    // Check if this was the final approval or if event was rejected
    let finalStatus = event.status
    let approvalStage = event.approval_stage

    if (action === 'reject') {
      finalStatus = 'rejected'
      approvalStage = 'rejected'
    } else {
      // Check if all required approvals are complete
      const updatedApprovals = approvals?.map(approval => 
        approval.id === currentApproval.id 
          ? { ...approval, status: 'approved' }
          : approval
      )

      const allApproved = updatedApprovals?.every(approval => 
        approval.status === 'approved'
      )

      if (allApproved) {
        finalStatus = 'approved'
        approvalStage = 'completed'
      } else {
        // Find next pending approval
        const nextApproval = updatedApprovals?.find(approval => 
          approval.status === 'pending' && approval.approval_level > currentApproval.approval_level
        )
        
        if (nextApproval) {
          approvalStage = nextApproval.approver_role
        }
      }
    }

    // Update event status
    const { error: eventUpdateError } = await supabase
      .from('events')
      .update({
        status: finalStatus,
        approval_stage: approvalStage,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (eventUpdateError) {
      return res.status(500).json({ error: 'Failed to update event status' })
    }

    // If event is approved, sync to calendar
    if (finalStatus === 'approved') {
      try {
        await syncToCalendar(event)
      } catch (calendarError) {
        console.error('Calendar sync error:', calendarError)
        // Don't fail the approval if calendar sync fails
      }
    }

    // Send notification to event creator and next approver
    try {
      await sendApprovalNotification(event, action, authContext, approvalStage)
    } catch (notificationError) {
      console.error('Notification error:', notificationError)
      // Don't fail the approval if notification fails
    }

    res.status(200).json({
      message: `Event ${action}d successfully`,
      status: finalStatus,
      approvalStage: approvalStage
    })

  } catch (error) {
    console.error('Error processing approval:', error)
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

function mapUserRoleToApproverRole(userRole: string): string {
  const roleMapping: Record<string, string> = {
    'admin': 'event_manager',
    'supervisor': 'campaign_director',
    'super_admin': 'chief_of_staff'
  }

  return roleMapping[userRole] || userRole
}

async function syncToCalendar(event: any) {
  // Check if politician has calendar integration
  const { data: integration } = await supabase
    .from('calendar_integrations')
    .select('*')
    .eq('politician_id', event.politician_id)
    .eq('provider', 'google')
    .eq('status', 'connected')
    .single()

  if (!integration) {
    return // No calendar integration
  }

  // Update calendar event status to sync
  await supabase
    .from('calendar_events')
    .update({ sync_status: 'syncing' })
    .eq('event_id', event.id)

  // Here you would integrate with actual Google Calendar API
  // For now, we'll just mark it as synced
  setTimeout(async () => {
    await supabase
      .from('calendar_events')
      .update({ 
        sync_status: 'synced',
        external_event_id: `google_${event.id}_${Date.now()}`
      })
      .eq('event_id', event.id)
  }, 1000)
}

async function sendApprovalNotification(
  event: any, 
  action: string, 
  authContext: any, 
  nextStage: string
) {
  // Create notification record
  const notification = {
    type: 'event_approval',
    title: `Event ${action}d: ${event.title}`,
    message: `Your event "${event.title}" has been ${action}d`,
    recipient_id: event.created_by,
    related_id: event.id,
    politician_id: event.politician_id,
    created_at: new Date().toISOString()
  }

  await supabase.from('notifications').insert(notification)

  // If approved and there's a next stage, notify next approver
  if (action === 'approve' && nextStage && nextStage !== 'completed') {
    const nextApproverNotification = {
      type: 'approval_required',
      title: `Event approval required: ${event.title}`,
      message: `Please review and approve the event "${event.title}"`,
      recipient_role: nextStage,
      related_id: event.id,
      politician_id: event.politician_id,
      created_at: new Date().toISOString()
    }

    await supabase.from('notifications').insert(nextApproverNotification)
  }
}