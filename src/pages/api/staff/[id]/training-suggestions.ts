import { NextApiRequest, NextApiResponse } from 'next'
import { staffService, taskService } from '@/lib/supabase-admin'

// Mock training modules - in real app, this would come from a database
const TRAINING_MODULES = [
  {
    id: 'water-101',
    title: 'Water Supply Issues - Basic Resolution',
    description: 'Learn how to handle common water supply complaints effectively',
    category: 'water',
    content_url: '/training/water-basics',
    duration_minutes: 30,
    difficulty_level: 'beginner'
  },
  {
    id: 'electricity-advanced',
    title: 'Advanced Electrical Complaint Handling',
    description: 'Complex electrical issues and escalation procedures',
    category: 'electricity',
    content_url: '/training/electricity-advanced',
    duration_minutes: 45,
    difficulty_level: 'advanced'
  },
  {
    id: 'communication-skills',
    title: 'Effective Communication with Voters',
    description: 'Improve your communication and conflict resolution skills',
    category: 'general',
    content_url: '/training/communication',
    duration_minutes: 25,
    difficulty_level: 'intermediate'
  },
  {
    id: 'sanitation-hygiene',
    title: 'Sanitation and Hygiene Protocols',
    description: 'Understanding public health and sanitation standards',
    category: 'sanitation',
    content_url: '/training/sanitation',
    duration_minutes: 35,
    difficulty_level: 'beginner'
  },
  {
    id: 'roads-infrastructure',
    title: 'Road and Infrastructure Maintenance',
    description: 'Identifying and reporting infrastructure issues',
    category: 'roads',
    content_url: '/training/infrastructure',
    duration_minutes: 40,
    difficulty_level: 'intermediate'
  }
]

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
    const { id } = req.query
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Staff ID is required' })
    }

    // Get staff member
    const staff = await staffService.getById(id)
    
    // Get tasks assigned to this staff member to analyze performance
    const staffTasks = await taskService.getAll({ assigned_to: id })
    
    // Analyze task performance by category
    const categoryAnalysis = analyzeTaskPerformance(staffTasks, staff.task_type_history)
    
    // Generate training suggestions based on weak areas
    const suggestions = generateTrainingSuggestions(categoryAnalysis, staff.performance.points)

    res.status(200).json({
      staff_id: id,
      staff_name: staff.name,
      analysis: categoryAnalysis,
      suggested_trainings: suggestions,
      total_suggestions: suggestions.length
    })

  } catch (error) {
    console.error('Error generating training suggestions:', error)
    
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ error: 'Staff member not found' })
    } else {
      res.status(500).json({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}

function analyzeTaskPerformance(tasks: any[], taskTypeHistory: Record<string, number>) {
  const analysis: Record<string, {
    total_tasks: number
    completed_tasks: number
    completion_rate: number
    avg_completion_time: number
    needs_improvement: boolean
  }> = {}

  // Group tasks by type
  const tasksByType = tasks.reduce((acc, task) => {
    const type = task.grievance_type
    if (!acc[type]) acc[type] = []
    acc[type].push(task)
    return acc
  }, {})

  // Analyze each task type
  Object.keys(tasksByType).forEach(type => {
    const typeTasks = tasksByType[type]
    const completed = typeTasks.filter((t: any) => t.status === 'completed')
    const completionRate = typeTasks.length > 0 ? completed.length / typeTasks.length : 0

    // Calculate average completion time (mock calculation)
    const avgCompletionTime = completed.length > 0 
      ? completed.reduce((sum: number, task: any) => {
          if (task.completed_at && task.created_at) {
            const start = new Date(task.created_at).getTime()
            const end = new Date(task.completed_at).getTime()
            return sum + (end - start) / (1000 * 60 * 60) // hours
          }
          return sum + 24 // default 24 hours if no timing data
        }, 0) / completed.length
      : 0

    analysis[type] = {
      total_tasks: typeTasks.length,
      completed_tasks: completed.length,
      completion_rate: completionRate,
      avg_completion_time: avgCompletionTime,
      needs_improvement: completionRate < 0.7 || avgCompletionTime > 48 // needs improvement if < 70% completion or > 48 hours avg
    }
  })

  return analysis
}

function generateTrainingSuggestions(analysis: any, staffPoints: number) {
  const suggestions = []

  // Find weak categories (low completion rate or high completion time)
  const weakCategories = Object.keys(analysis).filter(category => 
    analysis[category].needs_improvement
  )

  // Add training for weak categories
  weakCategories.forEach(category => {
    const relevantTraining = TRAINING_MODULES.filter(module => 
      module.category === category || module.category === 'general'
    )
    
    relevantTraining.forEach(training => {
      const priority = analysis[category].completion_rate < 0.5 ? 'high' : 
                     analysis[category].completion_rate < 0.7 ? 'medium' : 'low'
      
      suggestions.push({
        ...training,
        priority,
        reason: `Low performance in ${category} category (${Math.round(analysis[category].completion_rate * 100)}% completion rate)`,
        estimated_improvement: `Expected to improve ${category} handling by 15-25%`
      })
    })
  })

  // Add general training based on overall performance
  if (staffPoints < 50) {
    const generalTraining = TRAINING_MODULES.find(m => m.category === 'general')
    if (generalTraining && !suggestions.find(s => s.id === generalTraining.id)) {
      suggestions.push({
        ...generalTraining,
        priority: 'medium',
        reason: 'Low overall performance points (< 50)',
        estimated_improvement: 'Expected to improve overall performance by 10-15%'
      })
    }
  }

  // If no specific weaknesses, suggest advanced training
  if (suggestions.length === 0 && staffPoints > 100) {
    const advancedTraining = TRAINING_MODULES.filter(m => m.difficulty_level === 'advanced')
    advancedTraining.forEach(training => {
      suggestions.push({
        ...training,
        priority: 'low',
        reason: 'High performer - ready for advanced training',
        estimated_improvement: 'Skill enhancement and career development'
      })
    })
  }

  // Sort by priority
  const priorityOrder = { high: 3, medium: 2, low: 1 }
  return suggestions.sort((a, b) => 
    priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder]
  )
}