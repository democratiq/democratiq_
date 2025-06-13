import { NextApiRequest, NextApiResponse } from 'next'
import twilio from 'twilio'
import { taskService } from '@/lib/supabase-admin'

const VoiceResponse = twilio.twiml.VoiceResponse

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
    const twiml = new VoiceResponse()
    const callSid = req.body.CallSid
    const from = req.body.From
    const speechResult = req.body.SpeechResult
    const digits = req.body.Digits
    const callStatus = req.body.CallStatus

    console.log('Twilio webhook received:', { callSid, from, speechResult, digits, callStatus })

    // Handle different stages of the call
    const stage = req.query.stage as string

    switch (stage) {
      case 'greeting':
        handleGreeting(twiml)
        break
      case 'menu':
        handleMenu(twiml, digits)
        break
      case 'grievance_input':
        await handleGrievanceInput(twiml, speechResult, from, callSid)
        break
      case 'confirmation':
        handleConfirmation(twiml)
        break
      default:
        handleGreeting(twiml)
    }

    res.writeHead(200, { 'Content-Type': 'text/xml' })
    res.end(twiml.toString())

  } catch (error) {
    console.error('Twilio webhook error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

function handleGreeting(twiml: any) {
  twiml.say(
    {
      voice: 'alice',
      language: 'en-IN'
    },
    'Welcome to Democratiq Grievance System. Press 1 to file a new grievance, Press 2 to check status of existing grievance, or Press 3 to speak to an agent.'
  )
  
  twiml.gather({
    action: '/api/webhooks/twilio-voice?stage=menu',
    method: 'POST',
    numDigits: 1,
    timeout: 10
  })

  twiml.say('Sorry, I didn\'t receive your input. Please call back to try again.')
}

function handleMenu(twiml: any, digits: string) {
  switch (digits) {
    case '1':
      twiml.say('Please describe your grievance after the beep. Speak clearly and press any key when finished.')
      twiml.record({
        action: '/api/webhooks/twilio-voice?stage=grievance_input',
        method: 'POST',
        maxLength: 120, // 2 minutes max
        finishOnKey: '#',
        transcribe: true,
        transcribeCallback: '/api/webhooks/twilio-transcription'
      })
      break
    case '2':
      twiml.say('Please enter your 6-digit grievance ID followed by the hash key.')
      twiml.gather({
        action: '/api/webhooks/twilio-voice?stage=status_check',
        method: 'POST',
        numDigits: 6,
        finishOnKey: '#',
        timeout: 15
      })
      break
    case '3':
      twiml.say('Connecting you to an agent. Please hold.')
      // In production, this would connect to a live agent
      twiml.dial(process.env.AGENT_PHONE_NUMBER || '+1234567890')
      break
    default:
      twiml.say('Invalid option. Please call back and choose 1, 2, or 3.')
      twiml.hangup()
  }
}

async function handleGrievanceInput(twiml: any, speechResult: string, from: string, callSid: string) {
  if (speechResult) {
    try {
      // Create task from voice input
      const task = await taskService.create({
        title: `Voice Grievance from ${from}`,
        description: speechResult,
        status: 'open',
        priority: 'medium',
        source: 'voice',
        grievance_type: 'general',
        voter_phone: from,
        metadata: {
          call_sid: callSid,
          transcription: speechResult,
          call_duration: 'unknown'
        }
      })

      twiml.say(
        `Thank you. Your grievance has been recorded with ID ${task.id.slice(-6)}. You will receive updates via SMS. Have a good day.`
      )

      // Send SMS confirmation (optional)
      await sendSMSConfirmation(from, task.id)

    } catch (error) {
      console.error('Error creating task from voice:', error)
      twiml.say('Sorry, there was an error recording your grievance. Please try calling again later.')
    }
  } else {
    twiml.say('Sorry, I couldn\'t understand your grievance. Please call back and speak clearly.')
  }

  twiml.hangup()
}

function handleConfirmation(twiml: any) {
  twiml.say('Thank you for using Democratiq Grievance System. Your complaint has been registered. Goodbye.')
  twiml.hangup()
}

async function sendSMSConfirmation(to: string, taskId: string) {
  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )

    await client.messages.create({
      body: `Your grievance has been registered with ID: ${taskId.slice(-6)}. Track status at: ${process.env.NEXT_PUBLIC_BASE_URL}/track/${taskId}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to
    })

    console.log('SMS confirmation sent to:', to)
  } catch (error) {
    console.error('Error sending SMS:', error)
  }
}