"use client"

import { useState, useEffect } from 'react'
import { AuthGuard } from '@/components/auth-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { IconRefresh, IconLoader } from '@tabler/icons-react'

export default function WorkflowDebugPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [testTaskId, setTestTaskId] = useState('')
  const [progressTest, setProgressTest] = useState<any>(null)
  const [testingProgress, setTestingProgress] = useState(false)
  const [taskStepsTest, setTaskStepsTest] = useState<any>(null)
  const [testingTaskSteps, setTestingTaskSteps] = useState(false)

  const fetchDebugData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/debug/workflows')
      if (!response.ok) {
        throw new Error('Failed to fetch debug data')
      }
      const debugData = await response.json()
      setData(debugData)
    } catch (error) {
      console.error('Error fetching debug data:', error)
    } finally {
      setLoading(false)
    }
  }

  const testProgressTrigger = async () => {
    if (!testTaskId) {
      alert('Please enter a task ID')
      return
    }

    try {
      setTestingProgress(true)
      const response = await fetch('/api/test/progress-trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ taskId: parseInt(testTaskId) })
      })
      
      const result = await response.json()
      setProgressTest(result)
    } catch (error) {
      console.error('Error testing progress:', error)
      setProgressTest({ error: 'Failed to test progress trigger' })
    } finally {
      setTestingProgress(false)
    }
  }

  const testTaskSteps = async () => {
    try {
      setTestingTaskSteps(true)
      const response = await fetch('/api/tasks/list-with-steps')
      const result = await response.json()
      
      // Filter to show only tasks with workflow_id
      const workflowTasks = result.filter((t: any) => t.workflow_id)
      setTaskStepsTest({
        totalTasks: result.length,
        workflowTasks: workflowTasks.length,
        sampleTasks: workflowTasks.slice(0, 5).map((t: any) => ({
          id: t.id,
          title: t.title?.substring(0, 30) + '...',
          workflow_id: t.workflow_id,
          totalSteps: t.totalSteps,
          completedSteps: t.completedSteps
        }))
      })
    } catch (error) {
      console.error('Error testing task steps:', error)
      setTaskStepsTest({ error: 'Failed to test task steps' })
    } finally {
      setTestingTaskSteps(false)
    }
  }

  useEffect(() => {
    fetchDebugData()
  }, [])

  return (
    <AuthGuard>
      <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Workflow Debug</h1>
            <p className="text-muted-foreground">
              Debug information for workflows and task steps
            </p>
          </div>
          <Button onClick={fetchDebugData} disabled={loading} className="gap-2">
            <IconRefresh className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <IconLoader className="h-6 w-6 animate-spin mr-2" />
            <span>Loading debug data...</span>
          </div>
        ) : data ? (
          <div className="grid gap-6">
            {/* Progress Test Section */}
            <Card>
              <CardHeader>
                <CardTitle>Test Progress Calculation</CardTitle>
                <CardDescription>Test if progress triggers are working for a specific task</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Input
                    type="number"
                    placeholder="Enter Task ID"
                    value={testTaskId}
                    onChange={(e) => setTestTaskId(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={testProgressTrigger} disabled={testingProgress || !testTaskId}>
                    {testingProgress ? 'Testing...' : 'Test Progress'}
                  </Button>
                  <Button onClick={testTaskSteps} disabled={testingTaskSteps} variant="outline">
                    {testingTaskSteps ? 'Testing...' : 'Test Step Counts'}
                  </Button>
                </div>
                
                {progressTest && (
                  <div>
                    <h4 className="font-medium mb-2">Progress Test Result:</h4>
                    <pre className="text-xs overflow-auto bg-muted p-4 rounded max-h-64">
                      {JSON.stringify(progressTest, null, 2)}
                    </pre>
                  </div>
                )}
                
                {taskStepsTest && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Task Steps Test Result:</h4>
                    <pre className="text-xs overflow-auto bg-muted p-4 rounded max-h-64">
                      {JSON.stringify(taskStepsTest, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Categories</p>
                    <p className="text-2xl font-bold">{data.summary.totalCategories}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Workflows</p>
                    <p className="text-2xl font-bold">{data.summary.totalWorkflows}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Workflows with Steps</p>
                    <p className="text-2xl font-bold">{data.summary.workflowsWithSteps}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tasks with Workflows</p>
                    <p className="text-2xl font-bold">{data.summary.tasksWithWorkflows}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
                <CardDescription>All categories in the database</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-xs overflow-auto bg-muted p-4 rounded">
                  {JSON.stringify(data.categories, null, 2)}
                </pre>
              </CardContent>
            </Card>

            {/* Workflows */}
            <Card>
              <CardHeader>
                <CardTitle>Workflows</CardTitle>
                <CardDescription>All workflows with their steps</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-xs overflow-auto bg-muted p-4 rounded max-h-96">
                  {JSON.stringify(data.workflows, null, 2)}
                </pre>
              </CardContent>
            </Card>

            {/* Recent Tasks with Workflows */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Tasks with Workflows</CardTitle>
                <CardDescription>Tasks that have workflow_id set</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-xs overflow-auto bg-muted p-4 rounded">
                  {JSON.stringify(data.recentTasksWithWorkflow, null, 2)}
                </pre>
              </CardContent>
            </Card>

            {/* Recent Task Steps */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Task Workflow Steps</CardTitle>
                <CardDescription>Steps attached to tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-xs overflow-auto bg-muted p-4 rounded">
                  {JSON.stringify(data.recentTaskSteps, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        ) : (
          <p className="text-center text-muted-foreground">No data available</p>
        )}
      </div>
    </AuthGuard>
  )
}