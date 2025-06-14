"use client"

import { useState } from 'react'
import { AuthGuard } from '@/components/auth-guard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export default function TestWorkflowPage() {
  const [category, setCategory] = useState('')
  const [subcategory, setSubcategory] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const categories = [
    { value: 'general', label: 'General Complaint' },
    { value: 'water', label: 'Water Supply' },
    { value: 'electricity', label: 'Electricity' },
    { value: 'roads', label: 'Roads & Infrastructure' },
    { value: 'infrastructure', label: 'Infrastructure' },
    { value: 'sanitation', label: 'Sanitation' }
  ]

  const subcategories: Record<string, string[]> = {
    general: ['Information Request', 'Complaint', 'Suggestion', 'Feedback'],
    water: ['Pipe Leak', 'No Water Supply', 'Poor Water Quality', 'Billing Issues'],
    electricity: ['Power Outage', 'Street Light', 'Meter Issues', 'High Bills'],
    roads: ['Potholes', 'Road Construction', 'Traffic Issues', 'Signage'],
    infrastructure: ['Road Related', 'Bridge', 'Building', 'Other Infrastructure'],
    sanitation: ['Garbage Collection', 'Drain Cleaning', 'Public Toilets', 'Pest Control']
  }

  const testWorkflow = async () => {
    if (!category) {
      alert('Please select a category')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/test/workflow-attach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category,
          subcategory: subcategory === 'all' ? null : subcategory || null
        })
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Test error:', error)
      setResult({ error: 'Failed to test workflow attachment' })
    } finally {
      setLoading(false)
    }
  }

  const createTestTask = async () => {
    if (!category) {
      alert('Please select a category')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/tasks/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: `Test Task - ${category} - ${subcategory === 'all' ? 'none' : subcategory || 'none'}`,
          description: 'This is a test task to verify workflow attachment',
          grievance_type: category,
          sub_category: subcategory === 'all' ? null : subcategory || null,
          voter_name: 'Test User',
          priority: 'medium',
          status: 'open'
        })
      })

      const data = await response.json()
      setResult({ 
        taskCreated: true, 
        task: data,
        message: 'Task created! Check if workflow steps were attached.'
      })
    } catch (error) {
      console.error('Create task error:', error)
      setResult({ error: 'Failed to create test task' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthGuard>
      <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
        <h1 className="text-3xl font-bold">Test Workflow Attachment</h1>

        <Card>
          <CardHeader>
            <CardTitle>Test Workflow Lookup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={(value) => {
                  setCategory(value)
                  setSubcategory('')
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Subcategory</Label>
                <Select value={subcategory} onValueChange={setSubcategory} disabled={!category}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">None / All</SelectItem>
                    {category && subcategories[category]?.map(sub => (
                      <SelectItem key={sub} value={sub}>
                        {sub}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={testWorkflow} disabled={loading}>
                Test Workflow Lookup
              </Button>
              <Button onClick={createTestTask} disabled={loading} variant="outline">
                Create Test Task
              </Button>
            </div>

            {result && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Result:</h3>
                <pre className="bg-muted p-4 rounded text-xs overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  )
}