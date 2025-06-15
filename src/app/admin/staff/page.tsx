"use client"

import { useState, useEffect } from 'react'
import { AuthGuard } from '@/components/auth-guard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  IconPlus, 
  IconLoader, 
  IconEdit,
  IconTrash,
  IconUsers,
  IconMail,
  IconPhone,
  IconMapPin,
  IconFilter,
  IconSearch,
  IconChevronUp,
  IconChevronDown,
  IconEye
} from '@tabler/icons-react'
import { toast } from 'sonner'

interface Staff {
  id: string
  name: string
  email: string
  phone: string
  role: 'admin' | 'agent' | 'supervisor'
  department?: string
  location?: string
  is_active: boolean
  created_at: string
  updated_at: string
  politician_id?: string
}

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  
  // Filter and sort states
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterDepartment, setFilterDepartment] = useState<string>('all')
  const [sortField, setSortField] = useState<keyof Staff>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'agent' as 'admin' | 'agent' | 'supervisor',
    department: '',
    location: ''
  })

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      const { getAuthHeaders } = await import('@/lib/client-auth')
      const authHeaders = await getAuthHeaders()
      
      const response = await fetch('/api/staff/list', {
        headers: authHeaders
      })
      
      if (response.ok) {
        const data = await response.json()
        setStaff(data)
      } else if (response.status === 401 || response.status === 403) {
        console.log('User not authorized to fetch staff')
        setStaff([])
      } else {
        throw new Error('Failed to fetch staff')
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
      toast.error('Failed to load staff')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)

    try {
      if (!formData.name || !formData.email || !formData.phone || !formData.role || !formData.department) {
        toast.error('Please fill in all required fields')
        return
      }

      const url = editingStaff ? `/api/staff/${editingStaff.id}/update` : '/api/staff/create'
      const method = editingStaff ? 'PUT' : 'POST'

      const { getAuthHeaders } = await import('@/lib/client-auth')
      const authHeaders = await getAuthHeaders()

      const response = await fetch(url, {
        method,
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error(`Failed to ${editingStaff ? 'update' : 'create'} staff member`)
      }

      toast.success(`Staff member ${editingStaff ? 'updated' : 'created'} successfully!`)
      
      // Reset form and refresh list
      resetForm()
      fetchStaff()

    } catch (error) {
      console.error('Error with staff member:', error)
      toast.error(`Failed to ${editingStaff ? 'update' : 'create'} staff member. Please try again.`)
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = (staffMember: Staff) => {
    setEditingStaff(staffMember)
    setFormData({
      name: staffMember.name,
      email: staffMember.email,
      phone: staffMember.phone,
      role: staffMember.role,
      department: staffMember.department || '',
      location: staffMember.location || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (staffId: string) => {
    if (!confirm('Are you sure you want to deactivate this staff member?')) {
      return
    }

    try {
      const { getAuthHeaders } = await import('@/lib/client-auth')
      const authHeaders = await getAuthHeaders()

      const response = await fetch(`/api/staff/${staffId}/delete`, {
        method: 'DELETE',
        headers: authHeaders
      })

      if (!response.ok) {
        throw new Error('Failed to deactivate staff member')
      }

      toast.success('Staff member deactivated successfully!')
      fetchStaff()

    } catch (error) {
      console.error('Error deactivating staff member:', error)
      toast.error('Failed to deactivate staff member. Please try again.')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'agent',
      department: '',
      location: ''
    })
    setEditingStaff(null)
    setShowForm(false)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive'
      case 'supervisor': return 'default'
      case 'agent': return 'secondary'
      default: return 'outline'
    }
  }

  const getDepartmentLabel = (dept: string) => {
    const departmentLabels: Record<string, string> = {
      'help_desk': 'Help Desk',
      'field_operations': 'Field Operations',
      'voter_outreach': 'Voter Outreach',
      'social_media': 'Social Media',
      'administrative': 'Administrative',
      'event_management': 'Event Management',
      'public_relations': 'Public Relations',
      'it_support': 'IT Support',
      'finance': 'Finance',
      'legal': 'Legal'
    }
    return departmentLabels[dept] || dept
  }

  // Filter and sort staff
  const filteredAndSortedStaff = staff
    .filter(member => {
      // Search filter
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = searchQuery === '' || 
        member.name.toLowerCase().includes(searchLower) ||
        member.email.toLowerCase().includes(searchLower) ||
        member.phone.includes(searchQuery) ||
        (member.department && getDepartmentLabel(member.department).toLowerCase().includes(searchLower))

      // Role filter
      const matchesRole = filterRole === 'all' || member.role === filterRole

      // Department filter
      const matchesDepartment = filterDepartment === 'all' || member.department === filterDepartment

      return matchesSearch && matchesRole && matchesDepartment
    })
    .sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      // Handle special cases
      if (sortField === 'department') {
        aValue = getDepartmentLabel(a.department || '')
        bValue = getDepartmentLabel(b.department || '')
      }

      // Convert to string for comparison
      aValue = String(aValue || '').toLowerCase()
      bValue = String(bValue || '').toLowerCase()

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

  const handleSort = (field: keyof Staff) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setFilterRole('all')
    setFilterDepartment('all')
    setSortField('created_at')
    setSortOrder('desc')
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading staff...</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="space-y-6">
        {/* Header with Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Staff Management</h2>
            <p className="text-muted-foreground">
              Manage team members and their roles
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <IconPlus className="h-4 w-4" />
            {showForm ? 'Cancel' : 'Add Staff'}
          </Button>
        </div>

        <div>
          {/* Filters and View Toggle */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                  <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Role Filter */}
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                  </SelectContent>
                </Select>

                {/* Department Filter */}
                <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="help_desk">Help Desk</SelectItem>
                    <SelectItem value="field_operations">Field Operations</SelectItem>
                    <SelectItem value="voter_outreach">Voter Outreach</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="administrative">Administrative</SelectItem>
                    <SelectItem value="event_management">Event Management</SelectItem>
                    <SelectItem value="public_relations">Public Relations</SelectItem>
                    <SelectItem value="it_support">IT Support</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="legal">Legal</SelectItem>
                  </SelectContent>
                </Select>

                {/* Clear Filters */}
                <Button variant="outline" onClick={clearFilters} className="gap-2">
                  <IconFilter className="h-4 w-4" />
                  Clear
                </Button>
              </div>

              {/* View Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  className="gap-2"
                >
                  <IconEye className="h-4 w-4" />
                  Cards
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="gap-2"
                >
                  <IconUsers className="h-4 w-4" />
                  Table
                </Button>
              </div>
            </div>

            {/* Results Count */}
            <div className="text-sm text-muted-foreground">
              Showing {filteredAndSortedStaff.length} of {staff.length} staff members
            </div>
          </div>

          {showForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</CardTitle>
                <CardDescription>
                  {editingStaff ? 'Update staff member information' : 'Add a new team member with their role and contact details'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter full name"
                        required
                        disabled={formLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="email@example.com"
                        required
                        disabled={formLoading}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+91 XXXXX XXXXX"
                        required
                        disabled={formLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Role *</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value) => handleInputChange('role', value)}
                        disabled={formLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="agent">Agent</SelectItem>
                          <SelectItem value="supervisor">Supervisor</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="department">Department *</Label>
                      <Select
                        value={formData.department}
                        onValueChange={(value) => handleInputChange('department', value)}
                        disabled={formLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="help_desk">Help Desk</SelectItem>
                          <SelectItem value="field_operations">Field Operations</SelectItem>
                          <SelectItem value="voter_outreach">Voter Outreach</SelectItem>
                          <SelectItem value="social_media">Social Media</SelectItem>
                          <SelectItem value="administrative">Administrative</SelectItem>
                          <SelectItem value="event_management">Event Management</SelectItem>
                          <SelectItem value="public_relations">Public Relations</SelectItem>
                          <SelectItem value="it_support">IT Support</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="legal">Legal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="Office location or area"
                        disabled={formLoading}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button type="submit" disabled={formLoading}>
                      {formLoading ? (
                        <>
                          <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                          {editingStaff ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        editingStaff ? 'Update Staff' : 'Add Staff'
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={resetForm}
                      disabled={formLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Staff List */}
          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedStaff.map((member) => (
              <Card key={member.id}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`} />
                      <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold truncate">{member.name}</h3>
                        <Badge variant={getRoleBadgeVariant(member.role)}>
                          {member.role}
                        </Badge>
                      </div>
                      
                      {member.department && (
                        <div className="mt-1">
                          <Badge variant="outline" className="text-xs">
                            {getDepartmentLabel(member.department)}
                          </Badge>
                        </div>
                      )}
                      
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <IconMail className="h-3 w-3 mr-2" />
                          <span className="truncate">{member.email}</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <IconPhone className="h-3 w-3 mr-2" />
                          <span>{member.phone}</span>
                        </div>
                        {member.location && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <IconMapPin className="h-3 w-3 mr-2" />
                            <span className="truncate">{member.location}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Added {new Date(member.created_at).toLocaleDateString()}</span>
                        <Badge variant="secondary" className="text-xs">
                          Active
                        </Badge>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(member)}
                          className="flex-1"
                        >
                          <IconEdit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(member.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <IconTrash className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-semibold justify-start"
                          onClick={() => handleSort('name')}
                        >
                          Name
                          {sortField === 'name' && (
                            sortOrder === 'asc' ? 
                            <IconChevronUp className="ml-2 h-4 w-4" /> : 
                            <IconChevronDown className="ml-2 h-4 w-4" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-semibold justify-start"
                          onClick={() => handleSort('role')}
                        >
                          Role
                          {sortField === 'role' && (
                            sortOrder === 'asc' ? 
                            <IconChevronUp className="ml-2 h-4 w-4" /> : 
                            <IconChevronDown className="ml-2 h-4 w-4" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-semibold justify-start"
                          onClick={() => handleSort('department')}
                        >
                          Department
                          {sortField === 'department' && (
                            sortOrder === 'asc' ? 
                            <IconChevronUp className="ml-2 h-4 w-4" /> : 
                            <IconChevronDown className="ml-2 h-4 w-4" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-semibold justify-start"
                          onClick={() => handleSort('created_at')}
                        >
                          Added
                          {sortField === 'created_at' && (
                            sortOrder === 'asc' ? 
                            <IconChevronUp className="ml-2 h-4 w-4" /> : 
                            <IconChevronDown className="ml-2 h-4 w-4" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedStaff.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`} />
                              <AvatarFallback className="text-xs">{getInitials(member.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{member.name}</div>
                              {member.location && (
                                <div className="text-sm text-muted-foreground flex items-center">
                                  <IconMapPin className="h-3 w-3 mr-1" />
                                  {member.location}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(member.role)}>
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {member.department && (
                            <Badge variant="outline">
                              {getDepartmentLabel(member.department)}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <IconMail className="h-3 w-3 mr-2 text-muted-foreground" />
                            {member.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <IconPhone className="h-3 w-3 mr-2 text-muted-foreground" />
                            {member.phone}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(member.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            Active
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(member)}
                            >
                              <IconEdit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(member.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <IconTrash className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {filteredAndSortedStaff.length === 0 && !showForm && (
            <Card>
              <CardContent className="text-center py-8">
                <IconUsers className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  {staff.length === 0 ? 'No staff members found' : 'No staff members match your filters'}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {staff.length === 0 
                    ? 'Add your first team member to get started' 
                    : 'Try adjusting your search terms or filters'
                  }
                </p>
                {staff.length === 0 ? (
                  <Button onClick={() => setShowForm(true)}>
                    <IconPlus className="h-4 w-4 mr-2" />
                    Add First Staff Member
                  </Button>
                ) : (
                  <Button variant="outline" onClick={clearFilters}>
                    <IconFilter className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}