import { NextApiRequest, NextApiResponse } from 'next'
import QRCode from 'qrcode'

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
    const { 
      location = 'general', 
      category = 'general',
      format = 'png'
    } = req.query

    // Create form URL with pre-filled data
    const formUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/grievance-form?location=${encodeURIComponent(location as string)}&category=${encodeURIComponent(category as string)}`

    // Generate QR code
    const qrCodeDataURL = await QRCode.toDataURL(formUrl, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    })

    if (format === 'json') {
      res.status(200).json({
        qr_code: qrCodeDataURL,
        form_url: formUrl,
        location,
        category
      })
    } else {
      // Return raw image
      const base64Data = qrCodeDataURL.replace(/^data:image\/png;base64,/, '')
      const imageBuffer = Buffer.from(base64Data, 'base64')
      
      res.setHeader('Content-Type', 'image/png')
      res.setHeader('Content-Length', imageBuffer.length)
      res.status(200).send(imageBuffer)
    }

  } catch (error) {
    console.error('QR code generation error:', error)
    res.status(500).json({ error: 'Failed to generate QR code' })
  }
}