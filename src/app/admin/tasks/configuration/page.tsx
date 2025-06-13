"use client"

import { useState, useEffect } from 'react'
import { AuthGuard } from '@/components/auth-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { IconSettings, IconClock, IconBell, IconMail, IconPlus, IconEdit, IconTrash, IconTag, IconList } from '@tabler/icons-react'
import { toast } from 'sonner'

interface Category {
  id: string
  value: string
  label: string
  subcategories: string[]
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

  // Load categories on mount
  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      
      // For demo purposes, load from localStorage or use defaults
      const storedCategories = localStorage.getItem('taskCategories')
      if (storedCategories) {
        const data = JSON.parse(storedCategories)
        setCategories(data)
      } else {
        // Load default categories
        const defaultCategories = [
          {
            id: 'general',
            value: 'general',
            label: 'General Complaint',
            subcategories: ['Information Request', 'Complaint', 'Suggestion', 'Feedback'],
            created_at: '2024-01-01T00:00:00Z'
          },
          {
            id: 'water',
            value: 'water',
            label: 'Water Supply',
            subcategories: ['Pipe Leak', 'No Water Supply', 'Poor Water Quality', 'Billing Issues'],
            created_at: '2024-01-01T00:00:00Z'
          },
          {
            id: 'electricity',
            value: 'electricity',
            label: 'Electricity',
            subcategories: ['Power Outage', 'Street Light', 'Meter Issues', 'High Bills'],
            created_at: '2024-01-01T00:00:00Z'
          },
          {
            id: 'roads',
            value: 'roads',
            label: 'Roads & Infrastructure',
            subcategories: ['Potholes', 'Road Construction', 'Traffic Issues', 'Signage'],
            created_at: '2024-01-01T00:00:00Z'
          },
          {
            id: 'sanitation',
            value: 'sanitation',
            label: 'Sanitation',
            subcategories: ['Garbage Collection', 'Drain Cleaning', 'Public Toilets', 'Pest Control'],
            created_at: '2024-01-01T00:00:00Z'
          }
        ]
        setCategories(defaultCategories)
        localStorage.setItem('taskCategories', JSON.stringify(defaultCategories))
      }
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

      const categoryData = {
        id: formData.value,
        value: formData.value,
        label: formData.label,
        subcategories: subcategoriesArray,
        created_at: editingCategory?.created_at || new Date().toISOString()
      }

      // Get existing categories from localStorage
      const storedCategories = localStorage.getItem('taskCategories')
      let categories = storedCategories ? JSON.parse(storedCategories) : []

      if (editingCategory) {
        // Update existing category
        const index = categories.findIndex((cat: Category) => cat.id === editingCategory.id)
        if (index !== -1) {
          categories[index] = categoryData
        }
      } else {
        // Check if category with this value already exists
        const existingIndex = categories.findIndex((cat: Category) => cat.value === formData.value)
        if (existingIndex !== -1) {
          toast.error('A category with this value already exists')
          return
        }
        // Add new category
        categories.push(categoryData)
      }

      // Save to localStorage
      localStorage.setItem('taskCategories', JSON.stringify(categories))

      toast.success(editingCategory ? 'Category updated successfully' : 'Category created successfully')
      setDialogOpen(false)
      resetForm()
      fetchCategories()
    } catch (error) {
      console.error('Error saving category:', error)
      toast.error('Failed to save category')
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
      // Get existing categories from localStorage
      const storedCategories = localStorage.getItem('taskCategories')
      let categories = storedCategories ? JSON.parse(storedCategories) : []

      // Remove the category
      categories = categories.filter((cat: Category) => cat.id !== category.id)

      // Save back to localStorage
      localStorage.setItem('taskCategories', JSON.stringify(categories))

      toast.success('Category deleted successfully')
      fetchCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Failed to delete category')
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

  return (
    <AuthGuard>
      <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="text-3xl font-bold">Tasks Configuration</h1>
          <p className="text-muted-foreground">
            Configure task settings and workflows
          </p>
        </div>

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
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how and when notifications are sent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send email alerts for new tasks</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SLA Warnings</Label>
                  <p className="text-sm text-muted-foreground">Alert when tasks are approaching SLA deadline</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Daily Summary</Label>
                  <p className="text-sm text-muted-foreground">Send daily task summary to supervisors</p>
                </div>
                <Switch />
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

          <div className="flex justify-end gap-4">
            <Button variant="outline">Cancel</Button>
            <Button>Save Configuration</Button>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}