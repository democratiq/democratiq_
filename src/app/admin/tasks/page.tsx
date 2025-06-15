"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/auth-guard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { IconPlus, IconLoader, IconUser, IconPhone, IconMapPin, IconTag, IconCalendar, IconClock, IconEdit, IconCheck, IconX, IconSearch, IconFilter, IconChevronLeft, IconChevronRight, IconChecklist, IconCircleCheck, IconCircle, IconNotes } from '@tabler/icons-react'
import { toast } from 'sonner'
import { Task, TaskWithSLA } from '@/lib/database-types'
import { calculateSLAStatus, getSLABadgeVariant, getSLAText } from '@/lib/sla-utils'
import { getSourceIcon, getSourceLabel, sourceConfig } from '@/lib/source-utils'
import { PageLoader, TableLoader } from '@/components/page-loader'

export default function AdminTasksPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [tasks, setTasks] = useState<TaskWithSLA[]>([])
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [staff, setStaff] = useState<Array<{id: string; name: string; role: string}>>([])  
  const [loadingStaff, setLoadingStaff] = useState(true)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingField, setEditingField] = useState<{ taskId: number; field: string } | null>(null)
  const [tempValue, setTempValue] = useState('')
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterAssigned, setFilterAssigned] = useState<string>('all')
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [formData, setFormData] = useState({
    voter_name: '',
    voter_phone: '',
    voter_location: '',
    grievance_type: 'general',
    sub_category: 'none',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    assigned_to: 'unassigned',
    deadline: '',
    source: 'manual_entry' as 'voice_bot' | 'whatsapp' | 'manual_entry' | 'qr_code' | 'email'
  })

  const [grievanceTypes, setGrievanceTypes] = useState([
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
  ])

  const [subCategories, setSubCategories] = useState<Record<string, string[]>>({
    water: ['Pipe Leak', 'No Water Supply', 'Poor Water Quality', 'Billing Issues'],
    electricity: ['Power Outage', 'Street Light', 'Meter Issues', 'High Bills'],
    roads: ['Potholes', 'Road Construction', 'Traffic Issues', 'Signage'],
    sanitation: ['Garbage Collection', 'Drain Cleaning', 'Public Toilets', 'Pest Control'],
    healthcare: ['Hospital Services', 'Medicine Shortage', 'Doctor Availability', 'Emergency Services'],
    education: ['School Infrastructure', 'Teacher Issues', 'Transport', 'Scholarships'],
    safety: ['Street Crime', 'Domestic Violence', 'Public Safety', 'Emergency Response'],
    corruption: ['Bribery', 'Nepotism', 'Misconduct', 'Transparency Issues'],
    general: ['Information Request', 'Complaint', 'Suggestion', 'Feedback'],
    other: ['Other Issue']
  })

  const fetchTasks = async () => {
    try {
      setLoadingTasks(true)
      const { fetchWithAuth } = await import('@/lib/fetch-with-auth')
      const response = await fetchWithAuth('/api/tasks/list-with-steps')
      
      // Don't show error for authentication issues
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.log('User not authorized to fetch tasks')
          setTasks([])
          return
        }
        throw new Error('Failed to fetch tasks')
      }
      
      const data = await response.json()
      console.log('Fetched tasks with steps (detailed):', data.slice(0, 2).map(t => ({
        id: t.id,
        title: t.title,
        category: t.category,
        sub_category: t.sub_category,
        workflow_id: t.workflow_id,
        totalSteps: t.totalSteps,
        completedSteps: t.completedSteps
      })))
      
      // Check specific tasks with workflow_id
      const workflowTasks = data.filter((t: any) => t.workflow_id)
      console.log('Tasks with workflow_id count:', workflowTasks.length)
      if (workflowTasks.length === 0) {
        console.log('No tasks have workflow_id set. This means workflow attachment during task creation is not working.')
      }
      
      const tasksWithSLA = data.map((task: any) => calculateSLAStatus(task))
      setTasks(tasksWithSLA)
    } catch (error) {
      console.error('Error fetching tasks:', error)
      toast.error('Failed to load tasks')
    } finally {
      setLoadingTasks(false)
    }
  }

  const fetchStaff = async () => {
    try {
      setLoadingStaff(true)
      const { fetchWithAuth } = await import('@/lib/fetch-with-auth')
      const response = await fetchWithAuth('/api/staff/list')
      
      // Don't show error for authentication issues
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.log('User not authorized to fetch staff')
          setStaff([])
          return
        }
        throw new Error('Failed to fetch staff')
      }
      
      const data = await response.json()
      // Handle both array response and paginated response
      const staffArray = Array.isArray(data) ? data : data.staff || []
      setStaff(staffArray)
    } catch (error) {
      console.error('Error fetching staff:', error)
      toast.error('Failed to load staff')
    } finally {
      setLoadingStaff(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const { fetchWithAuth } = await import('@/lib/fetch-with-auth')
      const response = await fetchWithAuth('/api/categories/list')
      
      // Don't show error for authentication issues
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.log('User not authorized to fetch categories, using defaults')
          // Keep default categories without showing error
          return
        }
        throw new Error('Failed to fetch categories')
      }
      
      const data: Array<{value: string; label: string; subcategories?: string[]}> = await response.json()
      
      if (data && data.length > 0) {
        setGrievanceTypes(data.map((cat) => ({ value: cat.value, label: cat.label })))
        
        // Build subcategories mapping
        const subCatMapping: Record<string, string[]> = {}
        data.forEach((cat) => {
          subCatMapping[cat.value] = cat.subcategories || []
        })
        setSubCategories(subCatMapping)
      }
      // If no categories from API, keep the default ones already set
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to load categories, using defaults')
      // Keep default categories if API fails
    }
  }

  useEffect(() => {
    fetchTasks()
    fetchStaff()
    fetchCategories()
  }, [])

  const updateTask = async (taskId: number, updates: Partial<Task>) => {
    try {
      console.log('Updating task:', taskId, 'with updates:', updates)
      
      // Get auth headers
      const { getAuthHeaders } = await import('@/lib/client-auth')
      const authHeaders = await getAuthHeaders()
      
      const response = await fetch(`/api/tasks/update?id=${taskId}`, {
        method: 'PUT',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('API Error Response:', errorData)
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to update task`)
      }

      const updatedTask = await response.json()
      console.log('Task updated successfully:', updatedTask)
      console.log('Updated task sub_category:', updatedTask.sub_category)
      
      // Update local state with SLA calculation
      const updatedTaskWithSLA = calculateSLAStatus(updatedTask)
      setTasks(prev => prev.map(task => 
        task.id === taskId ? updatedTaskWithSLA : task
      ))
      
      // Also refresh the task list to ensure we have the latest data
      fetchTasks()
      
      toast.success('Task updated successfully')
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update task')
    }
  }

  const startEditing = (taskId: number, field: string, currentValue: string) => {
    setEditingField({ taskId, field })
    setTempValue(currentValue)
  }

  const cancelEditing = () => {
    setEditingField(null)
    setTempValue('')
  }

  const saveEdit = async () => {
    if (!editingField) return
    
    const { taskId, field } = editingField
    let value: string | number = tempValue
    
    // Convert 'unassigned' to undefined for the assigned_to field
    if (field === 'assigned_to' && value === 'unassigned') {
      value = undefined
    }
    
    await updateTask(taskId, { [field]: value })
    setEditingField(null)
    setTempValue('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.voter_name || !formData.description) {
        toast.error('Please fill in all required fields')
        return
      }

      const requestData = {
        title: `${getSourceLabel(formData.source)}: ${grievanceTypes.find(t => t.value === formData.grievance_type)?.label} - ${formData.voter_name}`,
        description: formData.description,
        status: 'open',
        priority: formData.priority,
        grievance_type: formData.grievance_type,
        sub_category: formData.sub_category === 'none' ? undefined : formData.sub_category,
        voter_name: formData.voter_name,
        assigned_to: formData.assigned_to === 'unassigned' ? undefined : formData.assigned_to,
        deadline: formData.deadline || undefined,
        source: formData.source
      }
      
      console.log('Creating task with data:', requestData)

      // Get auth headers
      const { getAuthHeaders } = await import('@/lib/client-auth')
      const authHeaders = await getAuthHeaders()

      const response = await fetch('/api/tasks/create', {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Task creation failed:', response.status, errorData)
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to create task`)
      }

      const result = await response.json()
      
      toast.success(`Task created successfully! ID: ${result.id}`)
      
      // Reset form
      setFormData({
        voter_name: '',
        voter_phone: '',
        voter_location: '',
        grievance_type: 'general',
        sub_category: 'none',
        description: '',
        priority: 'medium',
        assigned_to: 'unassigned',
        deadline: '',
        source: 'manual_entry'
      })
      setShowForm(false)
      
      // Refresh tasks list
      fetchTasks()

    } catch (error) {
      console.error('Error creating task:', error)
      toast.error('Failed to create task. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter(task => {
    // Search filter
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !task.filled_by.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    
    // Category filter
    if (filterCategory !== 'all' && task.category !== filterCategory) {
      return false
    }
    
    // Status filter
    if (filterStatus !== 'all' && task.status !== filterStatus) {
      return false
    }
    
    // Priority filter
    if (filterPriority !== 'all' && task.priority !== filterPriority) {
      return false
    }
    
    // Assigned filter
    if (filterAssigned !== 'all') {
      if (filterAssigned === 'unassigned' && task.assigned_to) {
        return false
      }
      if (filterAssigned !== 'unassigned' && task.assigned_to !== filterAssigned) {
        return false
      }
    }
    
    return true
  })

  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / pageSize))
  const startIndex = (currentPage - 1) * pageSize
  const paginatedTasks = filteredTasks.slice(startIndex, startIndex + pageSize)

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterCategory, filterStatus, filterPriority, filterAssigned, pageSize])

  return (
    <AuthGuard>
      <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Task Management</h1>
            <p className="text-muted-foreground">
              Manually log and manage voter tasks
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <IconPlus className="h-4 w-4" />
            {showForm ? 'Cancel' : 'Add Task'}
          </Button>
        </div>

        {showForm && (
          <Card>
              <CardHeader>
                <CardTitle>Manual Task Entry</CardTitle>
                <CardDescription>
                  Enter task details on behalf of a voter
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="voter_name">
                        <IconUser className="inline h-4 w-4 mr-1" />
                        Voter Name *
                      </Label>
                      <Input
                        id="voter_name"
                        value={formData.voter_name}
                        onChange={(e) => handleInputChange('voter_name', e.target.value)}
                        placeholder="Enter voter's full name"
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="voter_phone">
                        <IconPhone className="inline h-4 w-4 mr-1" />
                        Phone Number
                      </Label>
                      <Input
                        id="voter_phone"
                        type="tel"
                        value={formData.voter_phone}
                        onChange={(e) => handleInputChange('voter_phone', e.target.value)}
                        placeholder="+91 XXXXX XXXXX (Optional)"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="voter_location">
                      <IconMapPin className="inline h-4 w-4 mr-1" />
                      Location
                    </Label>
                    <Input
                      id="voter_location"
                      value={formData.voter_location}
                      onChange={(e) => handleInputChange('voter_location', e.target.value)}
                      placeholder="Ward, Area, or Full Address"
                      disabled={loading}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="grievance_type">
                        <IconTag className="inline h-4 w-4 mr-1" />
                        Task Type *
                      </Label>
                      <Select
                        value={formData.grievance_type}
                        onValueChange={(value) => {
                          handleInputChange('grievance_type', value)
                          handleInputChange('sub_category', 'none') // Reset sub-category when category changes
                        }}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select task type" />
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
                      <Label htmlFor="sub_category">Sub Category</Label>
                      <Select
                        value={formData.sub_category}
                        onValueChange={(value) => handleInputChange('sub_category', value)}
                        disabled={loading || !formData.grievance_type}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={
                            !formData.grievance_type 
                              ? "Select category first" 
                              : (subCategories[formData.grievance_type]?.length || 0) === 0 
                                ? "No subcategories available"
                                : "Select sub category"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.grievance_type && subCategories[formData.grievance_type]?.length > 0 ? (
                            <>
                              <SelectItem value="none">None</SelectItem>
                              {subCategories[formData.grievance_type].map((subCat) => (
                                <SelectItem key={subCat} value={subCat}>
                                  {subCat}
                                </SelectItem>
                              ))}
                            </>
                          ) : (
                            <SelectItem value="no-subcategories" disabled>
                              {!formData.grievance_type 
                                ? "Please select a category first"
                                : "No subcategories available for this category"
                              }
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value) => handleInputChange('priority', value as 'low' | 'medium' | 'high')}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">
                            <Badge variant="secondary">Low</Badge>
                          </SelectItem>
                          <SelectItem value="medium">
                            <Badge variant="outline">Medium</Badge>
                          </SelectItem>
                          <SelectItem value="high">
                            <Badge variant="destructive">High</Badge>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="source">Source</Label>
                      <Select
                        value={formData.source}
                        onValueChange={(value) => handleInputChange('source', value)}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(sourceConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                {getSourceIcon(key as any, 'h-4 w-4')}
                                <span>{config.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="assigned_to">Assign To</Label>
                      <Select
                        value={formData.assigned_to}
                        onValueChange={(value) => handleInputChange('assigned_to', value)}
                        disabled={loading || loadingStaff}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select agent" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {staff.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name} ({member.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="deadline">Deadline</Label>
                      <Input
                        id="deadline"
                        type="datetime-local"
                        value={formData.deadline}
                        onChange={(e) => handleInputChange('deadline', e.target.value)}
                        disabled={loading}
                      />
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
                      placeholder="Describe the task in detail..."
                      rows={5}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button type="submit" disabled={loading || formData.description.length < 10}>
                      {loading ? (
                        <>
                          <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Task'
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowForm(false)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
          </Card>
        )}

        <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Tasks</CardTitle>
                    <CardDescription>
                      All tasks submitted through various channels
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Showing {filteredTasks.length} of {tasks.length} tasks</span>
                  </div>
                </div>
                
                {/* Search and Filters */}
                <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
                  {/* Search Bar - Left Side */}
                  <div className="relative flex-1 max-w-sm">
                    <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by title or name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  
                  {/* Filters - Right Side */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {grievanceTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={filterPriority} onValueChange={setFilterPriority}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={filterAssigned} onValueChange={setFilterAssigned}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Assigned To" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Agents</SelectItem>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {staff.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {(searchQuery || filterCategory !== 'all' || filterStatus !== 'all' || 
                      filterPriority !== 'all' || filterAssigned !== 'all') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchQuery('')
                          setFilterCategory('all')
                          setFilterStatus('all')
                          setFilterPriority('all')
                          setFilterAssigned('all')
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <TableLoader loading={loadingTasks} loadingText="Loading tasks..." rows={8}>
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      {tasks.length === 0 
                        ? "No tasks found. Create your first task using the button above."
                        : "No tasks match your current filters. Try adjusting or clearing filters."}
                    </p>
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto">
                  <Table className="w-full relative">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8 text-xs">Src</TableHead>
                        <TableHead className="w-12 text-xs">ID</TableHead>
                        <TableHead className="text-xs">Title</TableHead>
                        <TableHead className="w-24 text-xs">Category</TableHead>
                        <TableHead className="w-24 text-xs">Sub Cat.</TableHead>
                        <TableHead className="w-20 text-xs">By</TableHead>
                        <TableHead className="w-28 text-xs">Assigned</TableHead>
                        <TableHead className="w-20 text-xs">Priority</TableHead>
                        <TableHead className="w-24 text-xs">Status</TableHead>
                        <TableHead className="w-20 text-xs">SLA</TableHead>
                        <TableHead className="w-24 text-xs hidden lg:table-cell">Progress</TableHead>
                        <TableHead className="w-16 text-xs">Date</TableHead>
                        <TableHead className="w-12 sticky right-0 bg-background"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedTasks.map((task) => (
                        <TableRow key={task.id} className="group relative hover:bg-muted/50">
                          <TableCell className="text-center">
                            {getSourceIcon(task.source, 'h-4 w-4')}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            <Button
                              variant="link"
                              className="h-auto p-0 text-xs font-mono"
                              onClick={() => router.push(`/admin/tasks/${task.id}`)}
                            >
                              #{task.id}
                            </Button>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="line-clamp-2" title={task.title}>
                              {task.title}
                            </div>
                          </TableCell>
                          <TableCell>
                            {editingField?.taskId === task.id && editingField?.field === 'category' ? (
                              <div className="flex items-center gap-1">
                                <Select value={tempValue} onValueChange={setTempValue}>
                                  <SelectTrigger className="h-6 text-xs w-[90px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {grievanceTypes.map((type) => (
                                      <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={saveEdit}>
                                  <IconCheck className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={cancelEditing}>
                                  <IconX className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <Badge 
                                variant="outline" 
                                className="cursor-pointer hover:bg-muted text-xs"
                                onClick={() => startEditing(task.id, 'category', task.category)}
                              >
                                {grievanceTypes.find(t => t.value === task.category)?.label.split(' ')[0] || task.category}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingField?.taskId === task.id && editingField?.field === 'sub_category' ? (
                              <div className="flex items-center gap-1">
                                <Select value={tempValue} onValueChange={setTempValue}>
                                  <SelectTrigger className="h-6 text-xs w-[90px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {subCategories[task.category]?.map((subCat) => (
                                      <SelectItem key={subCat} value={subCat}>
                                        {subCat}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={saveEdit}>
                                  <IconCheck className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={cancelEditing}>
                                  <IconX className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <Badge 
                                variant="outline" 
                                className="cursor-pointer hover:bg-muted text-xs"
                                onClick={() => startEditing(task.id, 'sub_category', task.sub_category || 'none')}
                              >
                                {task.sub_category && task.sub_category !== 'none' ? task.sub_category : 'None'}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm truncate" title={task.filled_by}>
                            {task.filled_by.split(' ')[0]}
                          </TableCell>
                          <TableCell>
                            {editingField?.taskId === task.id && editingField?.field === 'assigned_to' ? (
                              <div className="flex items-center gap-1">
                                <Select value={tempValue} onValueChange={setTempValue}>
                                  <SelectTrigger className="h-6 text-xs w-[90px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="unassigned">Unassigned</SelectItem>
                                    {staff.map((member) => (
                                      <SelectItem key={member.id} value={member.id}>
                                        {member.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={saveEdit}>
                                  <IconCheck className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={cancelEditing}>
                                  <IconX className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <Badge 
                                variant="outline" 
                                className="cursor-pointer hover:bg-muted text-xs"
                                onClick={() => startEditing(task.id, 'assigned_to', task.assigned_to || 'unassigned')}
                              >
                                {task.assigned_to ? 
                                  staff.find(s => s.id === task.assigned_to)?.name || 'Unknown'
                                  : 'Unassigned'
                                }
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingField?.taskId === task.id && editingField?.field === 'priority' ? (
                              <div className="flex items-center gap-1">
                                <Select value={tempValue} onValueChange={setTempValue}>
                                  <SelectTrigger className="h-6 text-xs w-[90px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={saveEdit}>
                                  <IconCheck className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={cancelEditing}>
                                  <IconX className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <Badge 
                                variant={
                                  task.priority === 'high' 
                                    ? 'destructive' 
                                    : task.priority === 'medium' 
                                    ? 'default' 
                                    : 'secondary'
                                }
                                className="cursor-pointer hover:opacity-80 text-xs"
                                onClick={() => startEditing(task.id, 'priority', task.priority)}
                              >
                                {task.priority}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingField?.taskId === task.id && editingField?.field === 'status' ? (
                              <div className="flex items-center gap-1">
                                <Select value={tempValue} onValueChange={setTempValue}>
                                  <SelectTrigger className="h-6 text-xs w-[90px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="closed">Closed</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={saveEdit}>
                                  <IconCheck className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={cancelEditing}>
                                  <IconX className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <Badge 
                                variant={
                                  task.status === 'completed' 
                                    ? 'default' 
                                    : task.status === 'in_progress' 
                                    ? 'secondary' 
                                    : 'outline'
                                }
                                className="cursor-pointer hover:opacity-80 text-xs"
                                onClick={() => startEditing(task.id, 'status', task.status)}
                              >
                                {task.status.replace('_', ' ')}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={getSLABadgeVariant(task.sla_status)}
                              className="text-xs"
                            >
                              {getSLAText(task)}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="flex items-center gap-1">
                              {(() => {
                                // Debug logging for this specific task
                                console.log(`Task ${task.id} debug:`, {
                                  workflow_id: task.workflow_id,
                                  totalSteps: task.totalSteps,
                                  completedSteps: task.completedSteps,
                                  hasSteps: task.totalSteps > 0
                                })
                                
                                // Show step counts if there are steps, regardless of workflow_id
                                if (task.totalSteps > 0) {
                                  return (
                                    <>
                                      <IconChecklist className="h-3 w-3 text-blue-600" title="Has workflow steps" />
                                      <span className="text-xs font-medium">
                                        {task.completedSteps || 0}/{task.totalSteps}
                                      </span>
                                    </>
                                  )
                                } else if (task.workflow_id) {
                                  return (
                                    <>
                                      <IconChecklist className="h-3 w-3 text-orange-600" title="Has workflow (no steps)" />
                                      <span className="text-xs text-muted-foreground">0/0</span>
                                    </>
                                  )
                                } else {
                                  return (
                                    <span className="text-xs text-muted-foreground">{task.progress}%</span>
                                  )
                                }
                              })()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <div className="text-xs text-muted-foreground" title={new Date(task.created_at).toLocaleString()}>
                                {new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </div>
                              {task.workflow_id && (
                                <Badge variant="outline" className="text-xs h-5 px-1">
                                  <IconChecklist className="h-3 w-3" />
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="sticky right-0 bg-background px-2">
                            <div className="flex justify-end">
                              <Dialog open={editDialogOpen && editingTask?.id === task.id} onOpenChange={(open) => {
                                if (!open) {
                                  setEditDialogOpen(false)
                                  setEditingTask(null)
                                }
                              }}>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                      setEditingTask(task)
                                      setEditDialogOpen(true)
                                    }}
                                  >
                                    <IconEdit className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Edit Task #{task.id}</DialogTitle>
                                    <DialogDescription>
                                      Update the task details below
                                    </DialogDescription>
                                  </DialogHeader>
                                  {editingTask?.id === task.id && (
                                    <EditTaskForm 
                                      task={editingTask} 
                                      onUpdate={updateTask} 
                                      onClose={() => {
                                        setEditDialogOpen(false)
                                        setEditingTask(null)
                                      }}
                                      staff={staff}
                                      grievanceTypes={grievanceTypes}
                                      subCategories={subCategories}
                                    />
                                  )}
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {/* Pagination */}
              {filteredTasks.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground hidden sm:inline">Rows per page:</span>
                    <span className="text-sm text-muted-foreground sm:hidden">Per page:</span>
                    <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
                      <SelectTrigger className="w-[70px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                    <span className="text-sm text-muted-foreground text-center">
                      Page {currentPage} of {totalPages} <span className="hidden sm:inline">({filteredTasks.length} total)</span>
                    </span>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        <IconChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      {/* Page numbers */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum
                          if (totalPages <= 5) {
                            pageNum = i + 1
                          } else if (currentPage <= 3) {
                            pageNum = i + 1
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i
                          } else {
                            pageNum = currentPage - 2 + i
                          }
                          
                          if (pageNum < 1 || pageNum > totalPages) return null
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              className="w-8 h-8 p-0"
                              onClick={() => setCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          )
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <IconChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              </TableLoader>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  )
}

function EditTaskForm({ 
  task, 
  onUpdate, 
  onClose,
  staff = [],
  grievanceTypes = [],
  subCategories = {}
}: { 
  task: Task
  onUpdate: (taskId: number, updates: Partial<Task>) => Promise<void>
  onClose: () => void
  staff?: Array<{id: string; name: string; role: string}>
  grievanceTypes?: { value: string; label: string }[]
  subCategories?: Record<string, string[]>
}) {
  const [editData, setEditData] = useState({
    title: task.title,
    category: task.category,
    sub_category: task.sub_category || 'none',
    filled_by: task.filled_by,
    priority: task.priority,
    status: task.status,
    progress: task.progress,
    assigned_to: task.assigned_to || 'unassigned',
    deadline: task.deadline || '',
    ai_summary: task.ai_summary || '',
    source: task.source || 'manual_entry'
  })
  const [saving, setSaving] = useState(false)
  const [workflowSteps, setWorkflowSteps] = useState<any[]>([])
  const [loadingSteps, setLoadingSteps] = useState(true)
  
  // Fetch workflow steps for the task
  const fetchWorkflowSteps = async () => {
    try {
      setLoadingSteps(true)
      const response = await fetch(`/api/tasks/${task.id}/steps`)
      if (!response.ok) {
        throw new Error('Failed to fetch workflow steps')
      }
      const steps = await response.json()
      setWorkflowSteps(steps)
    } catch (error) {
      console.error('Error fetching workflow steps:', error)
    } finally {
      setLoadingSteps(false)
    }
  }
  
  // Update workflow step status
  const updateStepStatus = async (stepId: string, status: string, notes?: string) => {
    try {
      const response = await fetch(`/api/tasks/${task.id}/steps`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          stepId,
          status,
          notes,
          completed_by: 'admin' // You might want to get the actual user
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update step')
      }
      
      await fetchWorkflowSteps()
      toast.success('Step updated successfully')
    } catch (error) {
      console.error('Error updating step:', error)
      toast.error('Failed to update step')
    }
  }
  
  useEffect(() => {
    fetchWorkflowSteps()
  }, [task.id])

  const handleSave = async () => {
    setSaving(true)
    try {
      // Convert "none" values to undefined for cleaner data
      const cleanedData = {
        ...editData,
        sub_category: editData.sub_category === 'none' ? undefined : editData.sub_category,
        assigned_to: editData.assigned_to === 'unassigned' ? undefined : editData.assigned_to
      }
      await onUpdate(task.id, cleanedData)
      onClose()
      toast.success('Task updated successfully')
    } catch (error) {
      toast.error('Failed to update task')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    if (field === 'category') {
      // Reset sub_category when category changes
      setEditData(prev => ({ ...prev, [field]: value, sub_category: 'none' }))
    } else {
      setEditData(prev => ({ ...prev, [field]: value }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Basic Information</h3>
        
        <div className="space-y-2">
          <Label htmlFor="edit-title">Title</Label>
          <Input
            id="edit-title"
            value={editData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            disabled={saving}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-filled-by">Filled By</Label>
          <Input
            id="edit-filled-by"
            value={editData.filled_by}
            onChange={(e) => handleInputChange('filled_by', e.target.value)}
            disabled={saving}
          />
        </div>
      </div>

      {/* Category & Classification */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Category & Classification</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-category">Category</Label>
            <Select 
              value={editData.category} 
              onValueChange={(value) => handleInputChange('category', value)}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue />
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
            <Label htmlFor="edit-sub-category">Sub Category</Label>
            <Select
              value={editData.sub_category}
              onValueChange={(value) => handleInputChange('sub_category', value)}
              disabled={saving || !editData.category}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  !editData.category 
                    ? "Select category first" 
                    : (subCategories[editData.category]?.length || 0) === 0 
                      ? "No subcategories available"
                      : "Select sub category"
                } />
              </SelectTrigger>
              <SelectContent>
                {editData.category && subCategories[editData.category]?.length > 0 ? (
                  <>
                    <SelectItem value="none">None</SelectItem>
                    {subCategories[editData.category].map((subCat) => (
                      <SelectItem key={subCat} value={subCat}>
                        {subCat}
                      </SelectItem>
                    ))}
                  </>
                ) : (
                  <SelectItem value="no-subcategories" disabled>
                    {!editData.category 
                      ? "Please select a category first"
                      : "No subcategories available for this category"
                    }
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Assignment & Deadline */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Assignment & Deadline</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-source">Source</Label>
            <Select 
              value={editData.source} 
              onValueChange={(value) => handleInputChange('source', value)}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(sourceConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      {getSourceIcon(key as any, 'h-4 w-4')}
                      <span>{config.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-assigned-to">Assigned To</Label>
            <Select 
              value={editData.assigned_to} 
              onValueChange={(value) => handleInputChange('assigned_to', value)}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {staff.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name} ({member.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-deadline">Deadline</Label>
            <Input
              id="edit-deadline"
              type="datetime-local"
              value={editData.deadline ? new Date(editData.deadline).toISOString().slice(0, 16) : ''}
              onChange={(e) => handleInputChange('deadline', e.target.value ? new Date(e.target.value).toISOString() : '')}
              disabled={saving}
            />
          </div>
        </div>
      </div>

      {/* Status & Priority */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Status & Priority</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-priority">Priority</Label>
            <Select 
              value={editData.priority} 
              onValueChange={(value) => handleInputChange('priority', value)}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Low</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">Medium</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="high">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">High</Badge>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-status">Status</Label>
            <Select 
              value={editData.status} 
              onValueChange={(value) => handleInputChange('status', value)}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">
                  <Badge variant="outline">Open</Badge>
                </SelectItem>
                <SelectItem value="in_progress">
                  <Badge variant="secondary">In Progress</Badge>
                </SelectItem>
                <SelectItem value="completed">
                  <Badge variant="default">Completed</Badge>
                </SelectItem>
                <SelectItem value="closed">
                  <Badge variant="outline">Closed</Badge>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Workflow Steps */}
      {workflowSteps.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <IconChecklist className="h-5 w-5" />
            Workflow Steps
          </h3>
          
          {loadingSteps ? (
            <div className="flex items-center justify-center py-4">
              <IconLoader className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Loading workflow steps...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {workflowSteps.map((step) => (
                <div 
                  key={step.id} 
                  className={`border rounded-lg p-4 transition-colors ${
                    step.status === 'completed' ? 'bg-green-50 border-green-200' : 
                    step.status === 'in_progress' ? 'bg-blue-50 border-blue-200' : 
                    'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-0.5">
                        {step.status === 'completed' ? (
                          <IconCircleCheck className="h-5 w-5 text-green-600" />
                        ) : step.status === 'in_progress' ? (
                          <div className="relative">
                            <IconCircle className="h-5 w-5 text-blue-600" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="h-2 w-2 bg-blue-600 rounded-full animate-pulse" />
                            </div>
                          </div>
                        ) : (
                          <IconCircle className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">Step {step.step_number}: {step.title}</h4>
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
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={step.status}
                        onValueChange={(value) => updateStepStatus(step.id, value)}
                        disabled={saving}
                      >
                        <SelectTrigger className="w-32 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="skipped">Skipped</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {step.notes && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-sm text-muted-foreground">
                        <IconNotes className="inline h-3 w-3 mr-1" />
                        {step.notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Progress Summary */}
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm font-medium">
                    {workflowSteps.filter(s => s.status === 'completed').length} of {workflowSteps.length} steps completed
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ 
                      width: `${(workflowSteps.filter(s => s.status === 'completed').length / workflowSteps.length) * 100}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Progress - Only show for tasks without workflow steps */}
      {workflowSteps.length === 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Progress Tracking</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-progress">Manual Progress</Label>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${editData.progress}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{editData.progress}%</span>
              </div>
            </div>
            <input
              id="edit-progress"
              type="range"
              min="0"
              max="100"
              value={editData.progress}
              onChange={(e) => handleInputChange('progress', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground">
              Set progress manually for tasks without workflow steps
            </p>
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Additional Notes</h3>
        
        <div className="space-y-2">
          <Label htmlFor="edit-summary">AI Summary</Label>
          <Textarea
            id="edit-summary"
            value={editData.ai_summary}
            onChange={(e) => handleInputChange('ai_summary', e.target.value)}
            placeholder="Optional AI generated summary or additional notes..."
            rows={4}
            disabled={saving}
          />
        </div>
      </div>

      {/* Task Metadata */}
      <div className="pt-4 border-t">
        <h3 className="text-lg font-medium mb-3">Task Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <IconTag className="h-4 w-4" />
            <span>Task ID: #{task.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <IconCalendar className="h-4 w-4" />
            <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t">
        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
          {saving ? (
            <>
              <IconLoader className="mr-2 h-4 w-4 animate-spin" />
              Saving Changes...
            </>
          ) : (
            <>
              <IconCheck className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
        <Button variant="outline" onClick={onClose} disabled={saving} className="w-full sm:w-auto">
          <IconX className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      </div>
    </div>
  )
}