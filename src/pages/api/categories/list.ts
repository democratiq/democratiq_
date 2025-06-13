import { NextApiRequest, NextApiResponse } from 'next'

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
    // For now, return the existing hardcoded categories as stored data
    // In production, this would come from a database
    const categories = [
      {
        id: 'general',
        value: 'general',
        label: 'General Complaint',
        subcategories: ['Information Request', 'Complaint', 'Suggestion', 'Feedback'],
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'water',
        value: 'water',
        label: 'Water Supply',
        subcategories: ['Pipe Leak', 'No Water Supply', 'Poor Water Quality', 'Billing Issues'],
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'electricity',
        value: 'electricity',
        label: 'Electricity',
        subcategories: ['Power Outage', 'Street Light', 'Meter Issues', 'High Bills'],
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'roads',
        value: 'roads',
        label: 'Roads & Infrastructure',
        subcategories: ['Potholes', 'Road Construction', 'Traffic Issues', 'Signage'],
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'sanitation',
        value: 'sanitation',
        label: 'Sanitation',
        subcategories: ['Garbage Collection', 'Drain Cleaning', 'Public Toilets', 'Pest Control'],
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'healthcare',
        value: 'healthcare',
        label: 'Healthcare',
        subcategories: ['Hospital Services', 'Medicine Shortage', 'Doctor Availability', 'Emergency Services'],
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'education',
        value: 'education',
        label: 'Education',
        subcategories: ['School Infrastructure', 'Teacher Issues', 'Transport', 'Scholarships'],
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'safety',
        value: 'safety',
        label: 'Safety & Security',
        subcategories: ['Street Crime', 'Domestic Violence', 'Public Safety', 'Emergency Response'],
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'corruption',
        value: 'corruption',
        label: 'Corruption',
        subcategories: ['Bribery', 'Nepotism', 'Misconduct', 'Transparency Issues'],
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'other',
        value: 'other',
        label: 'Other',
        subcategories: ['Other Issue'],
        created_at: '2024-01-01T00:00:00Z'
      }
    ]

    res.status(200).json(categories)

  } catch (error) {
    console.error('Error fetching categories:', error)
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}