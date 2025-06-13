"use client"

import { useState, useEffect } from 'react'
import { AuthGuard } from '@/components/auth-guard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  IconPlus, 
  IconLoader, 
  IconTrash, 
  IconEdit, 
  IconClock,
  IconCheck,
  IconListDetails,
  IconGripVertical 
} from '@tabler/icons-react'
import { toast } from 'sonner'
import { SOP } from '@/lib/database-types'

interface SOPStep {
  id: string
  step_number: number
  title: string
  description: string
  is_required: boolean
  estimated_time_minutes: number
}

export default function SOPsPage() {
  const [sops, setSops] = useState<SOP[]>([])
  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    task_type: 'general',
    description: '',
    steps: [] as SOPStep[]
  })

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
  ]

  useEffect(() => {
    fetchSOPs()
  }, [])

  const fetchSOPs = async () => {
    try {
      const response = await fetch('/api/sops/list')
      if (response.ok) {
        const data = await response.json()
        setSops(data)
      }
    } catch (error) {
      console.error('Error fetching SOPs:', error)
    } finally {
      setLoading(false)
    }
  }

  const addStep = () => {
    const newStep: SOPStep = {
      id: `temp-${Date.now()}`,
      step_number: formData.steps.length + 1,
      title: '',
      description: '',
      is_required: true,
      estimated_time_minutes: 15
    }
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }))
  }

  const updateStep = (stepId: string, field: keyof SOPStep, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map(step =>
        step.id === stepId ? { ...step, [field]: value } : step
      )
    }))
  }

  const removeStep = (stepId: string) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter(step => step.id !== stepId).map((step, index) => ({
        ...step,
        step_number: index + 1
      }))
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)

    try {
      if (!formData.title || !formData.task_type || !formData.description || formData.steps.length === 0) {
        toast.error('Please fill in all required fields and add at least one step')
        return
      }

      // Validate steps
      for (const step of formData.steps) {
        if (!step.title || !step.description) {
          toast.error('All steps must have a title and description')
          return
        }
      }

      const response = await fetch('/api/sops/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          created_by: 'admin' // In real app, get from auth context
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create SOP')
      }

      const result = await response.json()
      
      toast.success('SOP created successfully!')
      
      // Reset form and refresh list
      setFormData({
        title: '',
        task_type: 'general',
        description: '',
        steps: []
      })
      setShowForm(false)
      fetchSOPs()

    } catch (error) {
      console.error('Error creating SOP:', error)
      toast.error('Failed to create SOP. Please try again.')
    } finally {
      setFormLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading SOPs...</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <div className="border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Standard Operating Procedures</h1>
                <p className="text-muted-foreground">
                  Create and manage workflow templates for different grievance types
                </p>
              </div>
              <Button onClick={() => setShowForm(!showForm)} className="gap-2">
                <IconPlus className="h-4 w-4" />
                {showForm ? 'Cancel' : 'Create SOP'}
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          {showForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Create New SOP</CardTitle>
                <CardDescription>
                  Define a step-by-step workflow for handling specific types of grievances
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">SOP Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="e.g., Water Complaint Resolution Process"
                        required
                        disabled={formLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="task_type">Grievance Type *</Label>
                      <Select
                        value={formData.task_type}
                        onValueChange={(value) => handleInputChange('task_type', value)}
                        disabled={formLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select grievance type" />
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe the purpose and scope of this SOP..."
                      rows={3}
                      required
                      disabled={formLoading}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Workflow Steps *</Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={addStep}
                        disabled={formLoading}
                      >
                        <IconPlus className="h-4 w-4 mr-1" />
                        Add Step
                      </Button>
                    </div>

                    {formData.steps.map((step, index) => (
                      <Card key={step.id} className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex items-center gap-2 mt-2">
                            <IconGripVertical className="h-4 w-4 text-muted-foreground" />
                            <Badge variant="outline">{step.step_number}</Badge>
                          </div>
                          
                          <div className="flex-1 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <Label className="text-sm">Step Title</Label>
                                <Input
                                  value={step.title}
                                  onChange={(e) => updateStep(step.id, 'title', e.target.value)}
                                  placeholder="e.g., Initial Assessment"
                                  disabled={formLoading}
                                />
                              </div>
                              <div>
                                <Label className="text-sm">Estimated Time (minutes)</Label>
                                <Input
                                  type="number"
                                  value={step.estimated_time_minutes}
                                  onChange={(e) => updateStep(step.id, 'estimated_time_minutes', parseInt(e.target.value) || 15)}
                                  min="1"
                                  disabled={formLoading}
                                />
                              </div>
                            </div>
                            
                            <div>
                              <Label className="text-sm">Step Description</Label>
                              <Textarea
                                value={step.description}
                                onChange={(e) => updateStep(step.id, 'description', e.target.value)}
                                placeholder="Describe what needs to be done in this step..."
                                rows={2}
                                disabled={formLoading}
                              />
                            </div>

                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`required-${step.id}`}
                                checked={step.is_required}
                                onChange={(e) => updateStep(step.id, 'is_required', e.target.checked)}
                                disabled={formLoading}
                              />
                              <Label htmlFor={`required-${step.id}`} className="text-sm">
                                Required step
                              </Label>
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeStep(step.id)}
                            disabled={formLoading}
                          >
                            <IconTrash className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}

                    {formData.steps.length === 0 && (
                      <div className="text-center py-8 border-2 border-dashed rounded-lg">
                        <IconListDetails className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">No steps added yet</p>
                        <p className="text-sm text-muted-foreground">Click &quot;Add Step&quot; to create workflow steps</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button type="submit" disabled={formLoading || formData.steps.length === 0}>
                      {formLoading ? (
                        <>
                          <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create SOP'
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowForm(false)}
                      disabled={formLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* SOPs List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sops.map((sop) => (
              <Card key={sop.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{sop.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {grievanceTypes.find(t => t.value === sop.task_type)?.label}
                      </CardDescription>
                    </div>
                    <Badge variant={sop.is_active ? 'default' : 'secondary'}>
                      {sop.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {sop.description}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Steps:</span>
                      <span className="font-medium">{sop.steps.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Est. Time:</span>
                      <span className="font-medium">
                        {sop.steps.reduce((total, step) => total + step.estimated_time_minutes, 0)} min
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {sop.steps.slice(0, 3).map((step) => (
                      <div key={step.id} className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                          {step.step_number}
                        </Badge>
                        <span className="flex-1 truncate">{step.title}</span>
                        {step.is_required && (
                          <IconCheck className="h-3 w-3 text-green-500" />
                        )}
                        <span className="text-muted-foreground flex items-center gap-1">
                          <IconClock className="h-3 w-3" />
                          {step.estimated_time_minutes}m
                        </span>
                      </div>
                    ))}
                    {sop.steps.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{sop.steps.length - 3} more steps
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm">
                      <IconEdit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {sops.length === 0 && !showForm && (
            <Card>
              <CardContent className="text-center py-8">
                <IconListDetails className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No SOPs created yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first Standard Operating Procedure to streamline grievance handling
                </p>
                <Button onClick={() => setShowForm(true)}>
                  <IconPlus className="h-4 w-4 mr-2" />
                  Create First SOP
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}