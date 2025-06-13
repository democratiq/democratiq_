"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { IconLoader, IconMapPin, IconPhone, IconUser, IconMessageCircle } from '@tabler/icons-react'
import { toast } from 'sonner'

function TaskFormComponent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    voter_name: '',
    grievance_type: 'general',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  })

  // Set initial values after hydration to avoid SSR mismatch
  useEffect(() => {
    const category = searchParams.get('category')?.trim()
    // Ensure the category is valid before setting it
    if (category && category !== '' && grievanceTypes.some(type => type.value === category)) {
      setFormData(prev => ({ ...prev, grievance_type: category }))
    }
  }, [searchParams])

  const grievanceTypes = [
    { value: 'general', label: 'General Complaint' },
    { value: 'water', label: 'Water Supply' },
    { value: 'electricity', label: 'Electricity' },
    { value: 'roads', label: 'Roads & Infrastructure' },
    { value: 'sanitation', label: 'Sanitation' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'education', label: 'Education' },
    { value: 'safety', label: 'Safety & Security' },
    { value: 'corruption', label: 'Corruption' },
    { value: 'other', label: 'Other' }
  ].filter(type => type.value && type.value.trim() !== '') // Filter out any empty values

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.voter_name || !formData.description) {
        toast.error('Please fill in all required fields')
        return
      }

      const response = await fetch('/api/tasks/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: `${grievanceTypes.find(t => t.value === formData.grievance_type)?.label} - ${formData.voter_name}`,
          description: formData.description,
          status: 'open',
          priority: formData.priority,
          grievance_type: formData.grievance_type,
          voter_name: formData.voter_name
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit task')
      }

      const result = await response.json()
      
      toast.success('Task submitted successfully!')
      
      // Redirect to success page with task ID
      router.push(`/task-success?id=${result.id}`)

    } catch (error) {
      console.error('Error submitting task:', error)
      toast.error('Failed to submit task. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    // Ensure value is never empty string for select fields
    if ((field === 'grievance_type' || field === 'priority') && (!value || value.trim() === '')) {
      return
    }
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconMessageCircle className="h-6 w-6 text-primary" />
              Submit Task
            </CardTitle>
            <CardDescription>
              Please fill in your details and describe your task. We will respond within 24-48 hours.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="voter_name">
                  <IconUser className="inline h-4 w-4 mr-1" />
                  Full Name *
                </Label>
                <Input
                  id="voter_name"
                  value={formData.voter_name}
                  onChange={(e) => handleInputChange('voter_name', e.target.value)}
                  placeholder="Enter your full name"
                  required
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grievance_type">Category *</Label>
                  <Select
                    value={formData.grievance_type}
                    onValueChange={(value) => {
                      if (value && value.trim() !== '') {
                        handleInputChange('grievance_type', value)
                      }
                    }}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select task category" />
                    </SelectTrigger>
                    <SelectContent>
                      {grievanceTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => {
                      if (value && value.trim() !== '') {
                        handleInputChange('priority', value as 'low' | 'medium' | 'high')
                      }
                    }}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Task Description *
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Please describe your task in detail..."
                  rows={5}
                  required
                  disabled={loading}
                />
                <p className="text-sm text-muted-foreground">
                  Minimum 10 characters. Be as specific as possible.
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading || formData.description.length < 10}>
                {loading ? (
                  <>
                    <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Task'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function TaskFormPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">
      <IconLoader className="h-6 w-6 animate-spin" />
    </div>}>
      <TaskFormComponent />
    </Suspense>
  )
}