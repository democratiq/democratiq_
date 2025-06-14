"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/auth-guard'
import { WorkflowSteps } from '@/components/workflow-steps'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { IconArrowLeft, IconLoader, IconUser, IconCalendar, IconTag, IconClock, IconMapPin, IconPhone } from '@tabler/icons-react'
import { Task, TaskWithSLA } from '@/lib/database-types'
import { calculateSLAStatus, getSLABadgeVariant, getSLAText } from '@/lib/sla-utils'
import { toast } from 'sonner'

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const taskId = params.id as string
  
  const [task, setTask] = useState<TaskWithSLA | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchTask = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tasks/list')
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }
      const tasks = await response.json()
      const foundTask = tasks.find((t: Task) => t.id === parseInt(taskId))
      
      if (!foundTask) {
        throw new Error('Task not found')
      }
      
      const taskWithSLA = calculateSLAStatus(foundTask)
      setTask(taskWithSLA)
    } catch (error) {
      console.error('Error fetching task:', error)
      toast.error('Failed to load task details')
      router.push('/admin/tasks')
    } finally {
      setLoading(false)
    }
  }

  const handleProgressUpdate = (progress: number) => {
    if (task) {
      setTask(prev => prev ? { ...prev, progress } : null)
      
      // Update the progress display text if it exists
      const progressDisplay = document.getElementById('progress-display')
      if (progressDisplay && task.workflow_id) {
        // This will be updated by the WorkflowSteps component's progress summary
        progressDisplay.textContent = 'Steps progress'
      }
      
      // Also refresh the task data from server to ensure consistency
      setTimeout(() => {
        fetchTask()
      }, 1000)
    }
  }

  useEffect(() => {
    fetchTask()
  }, [taskId])

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-screen">
          <IconLoader className="h-8 w-8 animate-spin" />
        </div>
      </AuthGuard>
    )
  }

  if (!task) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Task not found</p>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/tasks')}
            >
              <IconArrowLeft className="h-4 w-4 mr-2" />
              Back to Tasks
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="text-2xl font-bold">Task #{task.id}</h1>
              <p className="text-sm text-muted-foreground">
                Created on {new Date(task.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={getSLABadgeVariant(task.sla_status)}>
              {getSLAText(task)}
            </Badge>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Content - Left Column */}
          <div className="md:col-span-2 space-y-6">
            {/* Task Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>{task.title}</CardTitle>
                <CardDescription>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline">
                      <IconTag className="h-3 w-3 mr-1" />
                      {task.category}
                    </Badge>
                    {task.sub_category && (
                      <Badge variant="outline">
                        {task.sub_category}
                      </Badge>
                    )}
                    <Badge 
                      variant={
                        task.priority === 'high' 
                          ? 'destructive' 
                          : task.priority === 'medium' 
                          ? 'default' 
                          : 'secondary'
                      }
                    >
                      {task.priority} priority
                    </Badge>
                    <Badge 
                      variant={
                        task.status === 'completed' 
                          ? 'default' 
                          : task.status === 'in_progress' 
                          ? 'secondary' 
                          : 'outline'
                      }
                    >
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {task.ai_summary && (
                  <div>
                    <h3 className="font-medium mb-2">Description</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {task.ai_summary}
                    </p>
                  </div>
                )}
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Submitted by</p>
                    <p className="font-medium flex items-center gap-1 mt-1">
                      <IconUser className="h-4 w-4" />
                      {task.filled_by}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-muted-foreground">Assigned to</p>
                    <p className="font-medium mt-1">
                      {task.assigned_to || 'Unassigned'}
                    </p>
                  </div>
                  
                  {task.deadline && (
                    <div>
                      <p className="text-muted-foreground">Deadline</p>
                      <p className="font-medium flex items-center gap-1 mt-1">
                        <IconCalendar className="h-4 w-4" />
                        {new Date(task.deadline).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-muted-foreground">Progress</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      {task.workflow_id ? (
                        <span className="text-sm font-medium" id="progress-display">
                          Steps progress
                        </span>
                      ) : (
                        <span className="text-sm font-medium">{task.progress}%</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Workflow Steps */}
            {task.workflow_id && (
              <WorkflowSteps 
                taskId={task.id} 
                onProgressUpdate={handleProgressUpdate}
              />
            )}
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => router.push(`/admin/tasks?edit=${task.id}`)}
                >
                  Edit Task Details
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  disabled={task.status === 'completed'}
                >
                  Mark as Completed
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                >
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            {/* Task Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 bg-primary rounded-full mt-1.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Task Created</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(task.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {task.assigned_to && (
                    <div className="flex items-start gap-3">
                      <div className="h-2 w-2 bg-blue-500 rounded-full mt-1.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Assigned</p>
                        <p className="text-xs text-muted-foreground">
                          To {task.assigned_to}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {task.status === 'in_progress' && (
                    <div className="flex items-start gap-3">
                      <div className="h-2 w-2 bg-yellow-500 rounded-full mt-1.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">In Progress</p>
                        <p className="text-xs text-muted-foreground">
                          {task.progress}% completed
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {task.status === 'completed' && (
                    <div className="flex items-start gap-3">
                      <div className="h-2 w-2 bg-green-500 rounded-full mt-1.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Completed</p>
                        <p className="text-xs text-muted-foreground">
                          Task resolved
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}