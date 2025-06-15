"use client"

import { useState, useEffect } from 'react'
import { AuthGuard } from '@/components/auth-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { IconLoader, IconSearch } from '@tabler/icons-react'
import { toast } from 'sonner'

export default function DebugTaskPage() {
  const [taskId, setTaskId] = useState('27')
  const [loading, setLoading] = useState(false)
  const [taskData, setTaskData] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const [userEmail, setUserEmail] = useState('chaitanya@gmail.com')

  const checkTask = async () => {
    if (!taskId) {
      toast.error('Please enter a task ID')
      return
    }

    setLoading(true)
    try {
      const { fetchWithAuth } = await import('@/lib/fetch-with-auth')
      
      // Fetch task details with service role to bypass RLS
      const response = await fetch('/api/debug/task-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ taskId: parseInt(taskId) })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch task data')
      }

      const data = await response.json()
      setTaskData(data)

    } catch (error) {
      console.error('Error fetching task:', error)
      toast.error('Failed to fetch task data')
    } finally {
      setLoading(false)
    }
  }

  const checkUser = async () => {
    if (!userEmail) {
      toast.error('Please enter a user email')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/debug/user-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: userEmail })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch user data')
      }

      const data = await response.json()
      setUserData(data)

    } catch (error) {
      console.error('Error fetching user:', error)
      toast.error('Failed to fetch user data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Auto-check on load
    checkTask()
    checkUser()
  }, [])

  return (
    <AuthGuard>
      <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="text-3xl font-bold">Task Debug Tool</h1>
          <p className="text-muted-foreground">
            Debug task visibility issues
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Task Lookup</CardTitle>
            <CardDescription>Check task details and politician association</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="taskId">Task ID</Label>
                <Input
                  id="taskId"
                  type="number"
                  value={taskId}
                  onChange={(e) => setTaskId(e.target.value)}
                  placeholder="Enter task ID"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={checkTask} disabled={loading}>
                  {loading ? <IconLoader className="h-4 w-4 animate-spin" /> : <IconSearch className="h-4 w-4" />}
                  Check Task
                </Button>
              </div>
            </div>

            {taskData && (
              <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                <h3 className="font-semibold">Task Details:</h3>
                <pre className="text-sm overflow-x-auto">
                  {JSON.stringify(taskData, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Lookup</CardTitle>
            <CardDescription>Check user details and politician association</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="userEmail">User Email</Label>
                <Input
                  id="userEmail"
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="Enter user email"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={checkUser} disabled={loading}>
                  {loading ? <IconLoader className="h-4 w-4 animate-spin" /> : <IconSearch className="h-4 w-4" />}
                  Check User
                </Button>
              </div>
            </div>

            {userData && (
              <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                <h3 className="font-semibold">User Details:</h3>
                <pre className="text-sm overflow-x-auto">
                  {JSON.stringify(userData, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {taskData && userData && (
          <Card>
            <CardHeader>
              <CardTitle>Visibility Analysis</CardTitle>
              <CardDescription>Why this task may not be visible to this user</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Task politician_id:</span>
                  <code className="px-2 py-1 bg-muted rounded">{taskData.task?.politician_id || 'null'}</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">User politician_id:</span>
                  <code className="px-2 py-1 bg-muted rounded">{userData.profile?.politician_id || 'null'}</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Match:</span>
                  <span className={`font-semibold ${
                    taskData.task?.politician_id === userData.profile?.politician_id 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {taskData.task?.politician_id === userData.profile?.politician_id ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
                {taskData.task?.politician_id !== userData.profile?.politician_id && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm">
                      <strong>Issue:</strong> The task belongs to politician_id {taskData.task?.politician_id || 'null'}, 
                      but the user is associated with politician_id {userData.profile?.politician_id || 'null'}.
                      Due to multi-tenant isolation, this user cannot see this task.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthGuard>
  )
}