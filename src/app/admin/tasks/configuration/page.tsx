"use client"

import { useState, useEffect } from 'react'
import { AuthGuard } from '@/components/auth-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { IconSettings, IconClock, IconBell, IconMail, IconPlus, IconEdit, IconTrash, IconTag, IconList } from '@tabler/icons-react'
import { toast } from 'sonner'
import { PageLoader } from '@/components/page-loader'

interface Category {
  id: string
  value: string
  label: string
  subcategories: string[]
  created_at: string
}

interface WorkflowStep {
  id: string
  title: string
  description: string
  duration: number
  required: boolean
}

interface Workflow {
  id: string
  category_id: string
  subcategory: string
  sla_days: number
  sla_hours: number
  warning_threshold: number
  steps?: WorkflowStep[]
  category?: {
    value: string
    label: string
  }
  created_at: string
}

export default function TasksConfigurationPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    value: '',
    label: '',
    subcategories: ''
  })

  // Workflow states
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState(false)
  const [workflowFormData, setWorkflowFormData] = useState({
    category: '',
    subcategory: '',
    sla_days: '',
    sla_hours: '',
    warning_threshold: '80'
  })
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([
    {
      id: '1',
      title: '',
      description: '',
      duration: 0,
      required: true
    }
  ])
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([])

  // Load categories on mount
  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      
      // Get auth headers properly
      const { getAuthHeaders } = await import('@/lib/client-auth')
      const authHeaders = await getAuthHeaders()
      
      const response = await fetch('/api/categories/list', {
        headers: authHeaders
      })
      
      // Don't show error for authentication issues
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.log('User not authorized to fetch categories')
          setCategories([])
          return
        }
        throw new Error('Failed to fetch categories')
      }
      
      const data = await response.json()
      console.log('Fetched categories:', data) // Debug log
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.value || !formData.label) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const subcategoriesArray = formData.subcategories
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)

      // Validate value format (should be lowercase, no spaces)
      if (!/^[a-z][a-z0-9_]*$/.test(formData.value)) {
        toast.error('Category value must be lowercase alphanumeric with underscores only, starting with a letter')
        return
      }

      const requestData = {
        value: formData.value,
        label: formData.label,
        subcategories: subcategoriesArray
      }

      // Get auth headers
      const { getAuthHeaders } = await import('@/lib/client-auth')
      const authHeaders = await getAuthHeaders()

      if (editingCategory) {
        // Update existing category
        const response = await fetch(`/api/categories/update?id=${editingCategory.id}`, {
          method: 'PUT',
          headers: {
            ...authHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update category')
        }
      } else {
        // Create new category
        const response = await fetch('/api/categories/create', {
          method: 'POST',
          headers: {
            ...authHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create category')
        }
      }

      toast.success(editingCategory ? 'Category updated successfully' : 'Category created successfully')
      setDialogOpen(false)
      resetForm()
      fetchCategories()
    } catch (error) {
      console.error('Error saving category:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save category')
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      value: category.value,
      label: category.label,
      subcategories: category.subcategories.join(', ')
    })
    setDialogOpen(true)
  }

  const handleDelete = async (category: Category) => {
    if (!confirm(`Are you sure you want to delete "${category.label}"? This action cannot be undone.`)) {
      return
    }

    try {
      // Get auth headers
      const { getAuthHeaders } = await import('@/lib/client-auth')
      const authHeaders = await getAuthHeaders()

      const response = await fetch(`/api/categories/delete?id=${category.id}`, {
        method: 'DELETE',
        headers: authHeaders
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete category')
      }

      toast.success('Category deleted successfully')
      fetchCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete category')
    }
  }

  const resetForm = () => {
    setEditingCategory(null)
    setFormData({
      value: '',
      label: '',
      subcategories: ''
    })
  }

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      resetForm()
    }
  }

  // Workflow functions
  const handleCategoryChange = (categoryValue: string) => {
    setWorkflowFormData(prev => ({ ...prev, category: categoryValue, subcategory: '' }))
    const selectedCategory = categories.find(cat => cat.value === categoryValue)
    setAvailableSubcategories(selectedCategory?.subcategories || [])
  }

  const addWorkflowStep = () => {
    const newStep: WorkflowStep = {
      id: String(workflowSteps.length + 1),
      title: '',
      description: '',
      duration: 0,
      required: true
    }
    setWorkflowSteps([...workflowSteps, newStep])
  }

  const removeWorkflowStep = (stepId: string) => {
    if (workflowSteps.length > 1) {
      setWorkflowSteps(workflowSteps.filter(step => step.id !== stepId))
    }
  }

  const updateWorkflowStep = (stepId: string, field: keyof WorkflowStep, value: any) => {
    setWorkflowSteps(workflowSteps.map(step => 
      step.id === stepId ? { ...step, [field]: value } : step
    ))
  }

  const handleWorkflowSubmit = async () => {
    try {
      if (!workflowFormData.category || !workflowFormData.sla_days) {
        toast.error('Please fill in category and SLA days')
        return
      }

      if (workflowSteps.some(step => !step.title)) {
        toast.error('Please fill in all step titles')
        return
      }

      // Find the category ID
      const selectedCategory = categories.find(cat => cat.value === workflowFormData.category)
      if (!selectedCategory) {
        toast.error('Selected category not found')
        return
      }

      const requestData = {
        category_id: selectedCategory.id,
        subcategory: workflowFormData.subcategory || 'all',
        sla_days: workflowFormData.sla_days,
        sla_hours: workflowFormData.sla_hours || '0',
        warning_threshold: workflowFormData.warning_threshold,
        steps: workflowSteps.map(step => ({
          title: step.title,
          description: step.description,
          duration: step.duration,
          required: step.required
        }))
      }

      // Get auth headers
      const { getAuthHeaders } = await import('@/lib/client-auth')
      const authHeaders = await getAuthHeaders()

      const response = await fetch('/api/workflows/create', {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create workflow')
      }

      setWorkflowDialogOpen(false)
      resetWorkflowForm()
      loadWorkflows()
      toast.success('Workflow created successfully')
    } catch (error) {
      console.error('Error creating workflow:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create workflow')
    }
  }

  const resetWorkflowForm = () => {
    setWorkflowFormData({
      category: '',
      subcategory: '',
      sla_days: '',
      sla_hours: '',
      warning_threshold: '80'
    })
    setWorkflowSteps([
      {
        id: '1',
        title: '',
        description: '',
        duration: 0,
        required: true
      }
    ])
    setAvailableSubcategories([])
  }

  const loadWorkflows = async () => {
    try {
      // Get auth headers properly
      const { getAuthHeaders } = await import('@/lib/client-auth')
      const authHeaders = await getAuthHeaders()
      
      const response = await fetch('/api/workflows/list', {
        headers: authHeaders
      })
      
      // Don't show error for authentication issues
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.log('User not authorized to fetch workflows')
          setWorkflows([])
          return
        }
        throw new Error('Failed to fetch workflows')
      }
      
      const data = await response.json()
      console.log('Fetched workflows:', data) // Debug log
      setWorkflows(data)
    } catch (error) {
      console.error('Error loading workflows:', error)
      toast.error('Failed to load workflows')
    }
  }

  // Load workflows on mount
  useEffect(() => {
    loadWorkflows()
  }, [])

  return (
    <AuthGuard>
      <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="text-3xl font-bold">Tasks Configuration</h1>
          <p className="text-muted-foreground">
            Configure task settings and workflows
          </p>
        </div>

        <PageLoader loading={loading} loadingText="Loading configuration...">
          <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <IconTag className="h-5 w-5" />
                    Categories & Subcategories
                  </CardTitle>
                  <CardDescription>
                    Manage task categories and their subcategories used in task creation
                  </CardDescription>
                </div>
                <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <IconPlus className="h-4 w-4" />
                      Add Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {editingCategory ? 'Edit Category' : 'Add New Category'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingCategory 
                          ? 'Update the category details below' 
                          : 'Create a new category with subcategories for task classification'
                        }
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="category-value">Category Value *</Label>
                        <Input
                          id="category-value"
                          value={formData.value}
                          onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                          placeholder="e.g., water, electricity, roads"
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Internal identifier (lowercase, no spaces)
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="category-label">Display Label *</Label>
                        <Input
                          id="category-label"
                          value={formData.label}
                          onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                          placeholder="e.g., Water Supply, Electricity, Roads"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="subcategories">Subcategories</Label>
                        <Input
                          id="subcategories"
                          value={formData.subcategories}
                          onChange={(e) => setFormData(prev => ({ ...prev, subcategories: e.target.value }))}
                          placeholder="Pipe Leak, No Water Supply, Water Quality"
                        />
                        <p className="text-xs text-muted-foreground">
                          Separate multiple subcategories with commas
                        </p>
                      </div>
                      
                      <div className="flex gap-3 pt-4">
                        <Button type="submit" className="flex-1">
                          {editingCategory ? 'Update Category' : 'Create Category'}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <p className="text-muted-foreground">Loading categories...</p>
                  </div>
                </div>
              ) : categories.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <IconTag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No categories found. Create your first category to get started.</p>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Subcategories</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.label}</TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {category.value}
                        </TableCell>
                        <TableCell>
                          {category.subcategories.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {category.subcategories.slice(0, 3).map((subcat, index) => (
                                <span key={index} className="text-xs bg-muted px-2 py-1 rounded">
                                  {subcat}
                                </span>
                              ))}
                              {category.subcategories.length > 3 && (
                                <span className="text-xs text-muted-foreground">
                                  +{category.subcategories.length - 3} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No subcategories</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(category.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => handleEdit(category)}
                            >
                              <IconEdit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => handleDelete(category)}
                            >
                              <IconTrash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <IconList className="h-5 w-5" />
                    Workflow Configuration
                  </CardTitle>
                  <CardDescription>
                    Define workflow steps for category and subcategory combinations with SLA timelines
                  </CardDescription>
                </div>
                <Dialog open={workflowDialogOpen} onOpenChange={setWorkflowDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <IconPlus className="h-4 w-4" />
                      Add Workflow
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create Workflow</DialogTitle>
                      <DialogDescription>
                        Define the steps required to complete tasks for specific category/subcategory combinations
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6">
                      {/* Category/Subcategory Selection */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="workflow-category">Category *</Label>
                          <Select value={workflowFormData.category} onValueChange={handleCategoryChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                  {category.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="workflow-subcategory">Subcategory</Label>
                          <Select 
                            value={workflowFormData.subcategory} 
                            onValueChange={(value) => setWorkflowFormData(prev => ({ ...prev, subcategory: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select subcategory" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Subcategories</SelectItem>
                              {availableSubcategories.map((subcat) => (
                                <SelectItem key={subcat} value={subcat}>
                                  {subcat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* SLA Configuration */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">SLA Configuration</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="workflow-sla-days">SLA Days *</Label>
                            <Input 
                              id="workflow-sla-days" 
                              type="number" 
                              placeholder="e.g., 7" 
                              value={workflowFormData.sla_days}
                              onChange={(e) => setWorkflowFormData(prev => ({ ...prev, sla_days: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="workflow-sla-hours">SLA Hours</Label>
                            <Input 
                              id="workflow-sla-hours" 
                              type="number" 
                              placeholder="e.g., 8" 
                              value={workflowFormData.sla_hours}
                              onChange={(e) => setWorkflowFormData(prev => ({ ...prev, sla_hours: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="workflow-warning-threshold">Warning Threshold (%)</Label>
                            <Input 
                              id="workflow-warning-threshold" 
                              type="number" 
                              placeholder="e.g., 80" 
                              value={workflowFormData.warning_threshold}
                              onChange={(e) => setWorkflowFormData(prev => ({ ...prev, warning_threshold: e.target.value }))}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Workflow Steps */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium">Workflow Steps</h3>
                          <Button type="button" variant="outline" size="sm" onClick={addWorkflowStep}>
                            <IconPlus className="h-4 w-4 mr-2" />
                            Add Step
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          {workflowSteps.map((step, index) => (
                            <div key={step.id} className="border rounded-lg p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">Step {index + 1}</Label>
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => removeWorkflowStep(step.id)}
                                  disabled={workflowSteps.length === 1}
                                >
                                  <IconTrash className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor={`step-title-${step.id}`}>Step Title *</Label>
                                  <Input 
                                    id={`step-title-${step.id}`} 
                                    placeholder="e.g., Initial Assessment" 
                                    value={step.title}
                                    onChange={(e) => updateWorkflowStep(step.id, 'title', e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`step-duration-${step.id}`}>Expected Duration (hours)</Label>
                                  <Input 
                                    id={`step-duration-${step.id}`} 
                                    type="number" 
                                    placeholder="e.g., 2" 
                                    value={step.duration}
                                    onChange={(e) => updateWorkflowStep(step.id, 'duration', parseInt(e.target.value) || 0)}
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`step-description-${step.id}`}>Step Description</Label>
                                <Textarea 
                                  id={`step-description-${step.id}`} 
                                  placeholder="Describe what needs to be done in this step..." 
                                  rows={2} 
                                  value={step.description}
                                  onChange={(e) => updateWorkflowStep(step.id, 'description', e.target.value)}
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch 
                                  id={`step-required-${step.id}`} 
                                  checked={step.required}
                                  onCheckedChange={(checked) => updateWorkflowStep(step.id, 'required', checked)}
                                />
                                <Label htmlFor={`step-required-${step.id}`} className="text-sm">Required step (must be completed to close task)</Label>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4 border-t">
                        <Button className="flex-1" onClick={handleWorkflowSubmit}>Create Workflow</Button>
                        <Button type="button" variant="outline" onClick={() => setWorkflowDialogOpen(false)}>Cancel</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflows.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <IconList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">No workflows configured yet</p>
                    <p className="text-sm text-muted-foreground">Create workflows to define step-by-step processes for completing tasks</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead>Subcategory</TableHead>
                        <TableHead>Steps</TableHead>
                        <TableHead>SLA</TableHead>
                        <TableHead>Warning</TableHead>
                        <TableHead className="w-20">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workflows.map((workflow) => (
                        <TableRow key={workflow.id}>
                          <TableCell className="font-medium">
                            {workflow.category?.label || categories.find(cat => cat.id === workflow.category_id)?.label || workflow.category_id}
                          </TableCell>
                          <TableCell>
                            {workflow.subcategory === 'all' ? 'All' : workflow.subcategory}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {workflow.steps && workflow.steps.slice(0, 2).map((step, index) => (
                                <span key={index} className="text-xs bg-muted px-2 py-1 rounded">
                                  {step.title}
                                </span>
                              ))}
                              {workflow.steps && workflow.steps.length > 2 && (
                                <span className="text-xs text-muted-foreground">
                                  +{workflow.steps.length - 2} more
                                </span>
                              )}
                              {(!workflow.steps || workflow.steps.length === 0) && (
                                <span className="text-xs text-muted-foreground">No steps</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {workflow.sla_days}d {workflow.sla_hours > 0 && `${workflow.sla_hours}h`}
                          </TableCell>
                          <TableCell>
                            {workflow.warning_threshold}%
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                              >
                                <IconEdit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                              >
                                <IconTrash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SLA Settings</CardTitle>
              <CardDescription>
                Configure Service Level Agreement timelines for different priority levels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="high-priority-sla">High Priority SLA (days)</Label>
                  <Input id="high-priority-sla" type="number" defaultValue="3" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medium-priority-sla">Medium Priority SLA (days)</Label>
                  <Input id="medium-priority-sla" type="number" defaultValue="7" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="low-priority-sla">Low Priority SLA (days)</Label>
                  <Input id="low-priority-sla" type="number" defaultValue="14" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Auto-Assignment Rules</CardTitle>
              <CardDescription>
                Configure automatic task assignment based on categories
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default Assignment</Label>
                <Select defaultValue="round-robin">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="round-robin">Round Robin</SelectItem>
                    <SelectItem value="least-loaded">Least Loaded Agent</SelectItem>
                    <SelectItem value="manual">Manual Assignment Only</SelectItem>
                    <SelectItem value="category-based">Category Based</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Push Notifications</CardTitle>
              <CardDescription>
                Configure push notification settings for real-time updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send push notifications to web browsers</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Task Assignment Notifications</Label>
                  <p className="text-sm text-muted-foreground">Notify agents when tasks are assigned to them</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Status Update Notifications</Label>
                  <p className="text-sm text-muted-foreground">Notify when task status changes</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SLA Warning Notifications</Label>
                  <p className="text-sm text-muted-foreground">Alert when tasks are approaching SLA deadline</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Task Notifications</Label>
                  <p className="text-sm text-muted-foreground">Notify supervisors of new task submissions</p>
                </div>
                <Switch />
              </div>
              <div className="space-y-2">
                <Label>Notification Frequency</Label>
                <Select defaultValue="immediate">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="every-5-min">Every 5 minutes</SelectItem>
                    <SelectItem value="every-15-min">Every 15 minutes</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily digest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quiet Hours</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quiet-start">Start Time</Label>
                    <Input id="quiet-start" type="time" defaultValue="22:00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quiet-end">End Time</Label>
                    <Input id="quiet-end" type="time" defaultValue="08:00" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  No notifications will be sent during quiet hours except for high priority tasks
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline">Cancel</Button>
            <Button>Save Configuration</Button>
          </div>
          </div>
        </PageLoader>
      </div>
    </AuthGuard>
  )
}