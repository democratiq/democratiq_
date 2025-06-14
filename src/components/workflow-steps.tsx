"use client"

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { IconChecklist, IconCircleCheck, IconCircle, IconNotes, IconClock, IconLoader } from '@tabler/icons-react'
import { toast } from 'sonner'

interface WorkflowStep {
  id: string
  task_id: number
  workflow_step_id: string
  step_number: number
  title: string
  description: string
  duration: number
  required: boolean
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  completed_at?: string
  completed_by?: string
  notes?: string
}

interface WorkflowStepsProps {
  taskId: number
  onProgressUpdate?: (progress: number) => void
  readOnly?: boolean
}

export function WorkflowSteps({ taskId, onProgressUpdate, readOnly = false }: WorkflowStepsProps) {
  const [steps, setSteps] = useState<WorkflowStep[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [showNotes, setShowNotes] = useState<Record<string, boolean>>({})

  const fetchSteps = async () => {
    try {
      setLoading(true)
      console.log('Fetching workflow steps for task:', taskId)
      const response = await fetch(`/api/tasks/${taskId}/steps`)
      if (!response.ok) {
        throw new Error('Failed to fetch workflow steps')
      }
      const data = await response.json()
      console.log('Fetched workflow steps:', data)
      setSteps(data)
      
      // Initialize notes
      const notesMap: Record<string, string> = {}
      data.forEach((step: WorkflowStep) => {
        if (step.notes) {
          notesMap[step.id] = step.notes
        }
      })
      setNotes(notesMap)
    } catch (error) {
      console.error('Error fetching workflow steps:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStepStatus = async (stepId: string, status: string) => {
    if (readOnly) return
    
    try {
      setUpdating(stepId)
      const response = await fetch(`/api/tasks/${taskId}/steps`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          stepId,
          status,
          notes: notes[stepId] || '',
          completed_by: 'current_user' // You might want to get the actual user
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update step')
      }
      
      // Refresh steps first to get updated data
      await fetchSteps()
      
      // Calculate local progress for immediate UI update
      const updatedSteps = steps.map(s => 
        s.id === stepId ? { ...s, status } : s
      )
      const completedCount = updatedSteps.filter(s => s.status === 'completed').length
      const localProgress = Math.round((completedCount / updatedSteps.length) * 100)
      
      // Update parent immediately with local calculation
      onProgressUpdate?.(localProgress)
      
      toast.success('Step updated successfully')
      
      // Also fetch the actual task progress from the server for accuracy
      if (onProgressUpdate) {
        try {
          const taskResponse = await fetch(`/api/tasks/list`)
          if (taskResponse.ok) {
            const tasks = await taskResponse.json()
            const updatedTask = tasks.find((t: any) => t.id === taskId)
            if (updatedTask) {
              console.log('Server task progress:', updatedTask.progress)
              onProgressUpdate(updatedTask.progress)
            }
          }
        } catch (error) {
          console.error('Error fetching updated progress:', error)
        }
      }
    } catch (error) {
      console.error('Error updating step:', error)
      toast.error('Failed to update step')
    } finally {
      setUpdating(null)
    }
  }

  useEffect(() => {
    fetchSteps()
  }, [taskId])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <IconLoader className="h-5 w-5 animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">Loading workflow steps...</span>
        </CardContent>
      </Card>
    )
  }

  if (steps.length === 0) {
    return null
  }

  const completedCount = steps.filter(s => s.status === 'completed').length
  const progress = Math.round((completedCount / steps.length) * 100)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconChecklist className="h-5 w-5" />
          Workflow Steps
        </CardTitle>
        <CardDescription>
          Complete these steps to resolve the task ({completedCount} of {steps.length} completed)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Summary */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{completedCount} of {steps.length} steps completed</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Steps List */}
        <div className="space-y-3">
          {steps.map((step) => (
            <div 
              key={step.id} 
              className={`border rounded-lg p-4 transition-colors ${
                step.status === 'completed' ? 'bg-green-50 border-green-200' : 
                step.status === 'in_progress' ? 'bg-blue-50 border-blue-200' : 
                step.status === 'skipped' ? 'bg-gray-100 border-gray-300' :
                'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {!readOnly ? (
                    <Checkbox
                      checked={step.status === 'completed'}
                      onCheckedChange={(checked) => {
                        updateStepStatus(step.id, checked ? 'completed' : 'pending')
                      }}
                      disabled={updating === step.id}
                      className="h-5 w-5"
                    />
                  ) : (
                    step.status === 'completed' ? (
                      <IconCircleCheck className="h-5 w-5 text-green-600" />
                    ) : step.status === 'in_progress' ? (
                      <div className="relative">
                        <IconCircle className="h-5 w-5 text-blue-600" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-2 w-2 bg-blue-600 rounded-full animate-pulse" />
                        </div>
                      </div>
                    ) : step.status === 'skipped' ? (
                      <IconCircle className="h-5 w-5 text-gray-500" />
                    ) : (
                      <IconCircle className="h-5 w-5 text-gray-400" />
                    )
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className={`font-medium ${step.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                          Step {step.step_number}: {step.title}
                        </h4>
                        {step.required && (
                          <Badge variant="outline" className="text-xs">Required</Badge>
                        )}
                      </div>
                      {step.description && (
                        <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                      )}
                      {step.duration > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          <IconClock className="inline h-3 w-3 mr-1" />
                          Expected duration: {step.duration} hour{step.duration !== 1 ? 's' : ''}
                        </p>
                      )}
                      {step.completed_at && (
                        <p className="text-xs text-green-600 mt-1">
                          Completed on {new Date(step.completed_at).toLocaleDateString()} by {step.completed_by}
                        </p>
                      )}
                    </div>
                    
                    {!readOnly && !step.required && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateStepStatus(step.id, step.status === 'skipped' ? 'pending' : 'skipped')}
                          disabled={updating === step.id}
                          className="text-xs"
                        >
                          {step.status === 'skipped' ? 'Unskip' : 'Skip'}
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Notes Section */}
                  {!readOnly && (
                    <div className="mt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowNotes(prev => ({ ...prev, [step.id]: !prev[step.id] }))}
                        className="text-xs"
                      >
                        <IconNotes className="h-3 w-3 mr-1" />
                        {showNotes[step.id] ? 'Hide' : 'Add'} Notes
                      </Button>
                      
                      {showNotes[step.id] && (
                        <div className="mt-2 space-y-2">
                          <Textarea
                            placeholder="Add notes for this step..."
                            value={notes[step.id] || ''}
                            onChange={(e) => setNotes(prev => ({ ...prev, [step.id]: e.target.value }))}
                            rows={2}
                            className="text-sm"
                          />
                          <Button
                            size="sm"
                            onClick={() => updateStepStatus(step.id, step.status)}
                            disabled={updating === step.id}
                          >
                            Save Notes
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {step.notes && !showNotes[step.id] && (
                    <div className="mt-2 p-2 bg-muted rounded text-sm">
                      <IconNotes className="inline h-3 w-3 mr-1" />
                      {step.notes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}