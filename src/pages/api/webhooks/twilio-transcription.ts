import { NextApiRequest, NextApiResponse } from 'next'
import { taskService } from '@/lib/supabase-admin'

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
    const {
      TranscriptionText,
      TranscriptionStatus,
      CallSid,
      From,
      RecordingUrl
    } = req.body

    console.log('Transcription received:', {
      TranscriptionText,
      TranscriptionStatus,
      CallSid,
      From
    })

    if (TranscriptionStatus === 'completed' && TranscriptionText) {
      // Find the task created for this call and update with transcription
      const tasks = await taskService.getAll({ source: 'voice' })
      const matchingTask = tasks.find(task => 
        task.metadata?.call_sid === CallSid && 
        task.voter_phone === From
      )

      if (matchingTask) {
        await taskService.update(matchingTask.id, {
          description: TranscriptionText,
          metadata: {
            ...matchingTask.metadata,
            transcription: TranscriptionText,
            transcription_status: TranscriptionStatus,
            recording_url: RecordingUrl
          }
        })

        console.log('Task updated with transcription:', matchingTask.id)
      }
    }

    res.status(200).json({ success: true })

  } catch (error) {
    console.error('Transcription webhook error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}