import { NextApiRequest, NextApiResponse } from 'next'
import { taskService } from '@/lib/supabase-admin'

interface WhatsAppMessage {
  id: string
  from: string
  timestamp: string
  type: 'text' | 'image' | 'audio' | 'document'
  text?: { body: string }
  image?: { id: string; mime_type: string; caption?: string }
  audio?: { id: string; mime_type: string }
  document?: { id: string; filename: string; mime_type: string }
}

interface WhatsAppWebhookBody {
  object: string
  entry: Array<{
    id: string
    changes: Array<{
      value: {
        messaging_product: string
        metadata: { phone_number_id: string }
        messages?: WhatsAppMessage[]
        statuses?: any[]
      }
      field: string
    }>
  }>
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    // Webhook verification
    const mode = req.query['hub.mode']
    const token = req.query['hub.verify_token']
    const challenge = req.query['hub.challenge']

    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log('WhatsApp webhook verified')
      res.status(200).send(challenge)
    } else {
      res.status(403).send('Forbidden')
    }
    return
  }

  if (req.method === 'POST') {
    try {
      const body: WhatsAppWebhookBody = req.body

      // Process incoming messages
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.value.messages) {
            for (const message of change.value.messages) {
              await processWhatsAppMessage(message)
            }
          }
        }
      }

      res.status(200).json({ success: true })
    } catch (error) {
      console.error('WhatsApp webhook error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}

async function processWhatsAppMessage(message: WhatsAppMessage) {
  try {
    let description = ''
    let attachments: string[] = []

    switch (message.type) {
      case 'text':
        description = message.text?.body || ''
        break
      case 'image':
        description = message.image?.caption || 'Image attachment received'
        if (message.image?.id) {
          // In a real implementation, you would download and store the media
          attachments.push(`whatsapp_media_${message.image.id}`)
        }
        break
      case 'audio':
        description = 'Voice message received'
        if (message.audio?.id) {
          attachments.push(`whatsapp_audio_${message.audio.id}`)
        }
        break
      case 'document':
        description = `Document received: ${message.document?.filename || 'Unknown file'}`
        if (message.document?.id) {
          attachments.push(`whatsapp_doc_${message.document.id}`)
        }
        break
    }

    // Create task in Supabase
    const task = await taskService.create({
      title: `WhatsApp Grievance from ${message.from}`,
      description,
      status: 'open',
      priority: 'medium',
      source: 'whatsapp',
      grievance_type: 'general',
      voter_phone: message.from,
      attachments: attachments.length > 0 ? attachments : undefined,
      metadata: {
        whatsapp_message_id: message.id,
        timestamp: message.timestamp,
        message_type: message.type
      }
    })

    console.log('Task created from WhatsApp:', task.id)

    // Send auto-reply (optional)
    await sendWhatsAppReply(message.from, `Thank you for your message. Your grievance has been recorded with ID: ${task.id}. We will respond within 24 hours.`)

  } catch (error) {
    console.error('Error processing WhatsApp message:', error)
  }
}

async function sendWhatsAppReply(to: string, message: string) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: message }
        })
      }
    )

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${response.statusText}`)
    }

    const result = await response.json()
    console.log('WhatsApp reply sent:', result)
  } catch (error) {
    console.error('Error sending WhatsApp reply:', error)
  }
}