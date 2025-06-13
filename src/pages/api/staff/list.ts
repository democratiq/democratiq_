import { NextApiRequest, NextApiResponse } from 'next'
import { staffService } from '@/lib/supabase-admin'

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
    const { role } = req.query

    // For now, return mock data since we don't have staff in the database yet
    const mockStaff = [
      {
        id: 'agent-1',
        name: 'John Smith',
        email: 'john.smith@example.com',
        phone: '+91 98765 43210',
        role: 'agent' as const,
        location: 'District Office',
        performance: {
          points: 850,
          tasks_completed: 42,
          avg_completion_time: 2.5,
          badges: ['silver', 'bronze'] as const
        },
        task_type_history: {
          'water': 15,
          'electricity': 12,
          'roads': 8,
          'general': 7
        },
        is_active: true,
        created_at: '2024-01-15T08:00:00Z',
        updated_at: '2024-06-13T10:30:00Z'
      },
      {
        id: 'agent-2',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@example.com',
        phone: '+91 98765 43211',
        role: 'agent' as const,
        location: 'Field Office',
        performance: {
          points: 1200,
          tasks_completed: 68,
          avg_completion_time: 1.8,
          badges: ['gold', 'silver'] as const
        },
        task_type_history: {
          'healthcare': 25,
          'education': 18,
          'sanitation': 15,
          'general': 10
        },
        is_active: true,
        created_at: '2024-01-10T09:00:00Z',
        updated_at: '2024-06-13T11:15:00Z'
      },
      {
        id: 'supervisor-1',
        name: 'Michael Chen',
        email: 'michael.chen@example.com',
        phone: '+91 98765 43212',
        role: 'supervisor' as const,
        location: 'Main Office',
        performance: {
          points: 2100,
          tasks_completed: 156,
          avg_completion_time: 1.2,
          badges: ['gold'] as const
        },
        task_type_history: {
          'corruption': 45,
          'safety': 38,
          'roads': 35,
          'general': 38
        },
        is_active: true,
        created_at: '2023-12-01T08:00:00Z',
        updated_at: '2024-06-13T09:45:00Z'
      },
      {
        id: 'agent-3',
        name: 'Priya Patel',
        email: 'priya.patel@example.com',
        phone: '+91 98765 43213',
        role: 'agent' as const,
        location: 'Remote',
        performance: {
          points: 950,
          tasks_completed: 51,
          avg_completion_time: 2.1,
          badges: ['silver'] as const
        },
        task_type_history: {
          'water': 20,
          'sanitation': 18,
          'healthcare': 8,
          'general': 5
        },
        is_active: true,
        created_at: '2024-02-01T08:00:00Z',
        updated_at: '2024-06-13T12:00:00Z'
      }
    ]

    // Filter by role if specified
    let filteredStaff = mockStaff
    if (role && typeof role === 'string') {
      filteredStaff = mockStaff.filter(staff => staff.role === role)
    }

    // Only return active staff
    const activeStaff = filteredStaff.filter(staff => staff.is_active)

    res.status(200).json(activeStaff)

  } catch (error) {
    console.error('Error fetching staff:', error)
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}