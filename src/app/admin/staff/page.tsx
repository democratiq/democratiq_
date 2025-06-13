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
import { 
  IconPlus, 
  IconLoader, 
  IconEdit,
  IconTrash,
  IconUsers,
  IconMail,
  IconPhone,
  IconMapPin
} from '@tabler/icons-react'
import { toast } from 'sonner'
import { Staff } from '@/lib/database-types'

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'agent' as 'admin' | 'agent' | 'supervisor',
    location: ''
  })

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/staff/list')
      if (response.ok) {
        const data = await response.json()
        setStaff(data)
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)

    try {
      if (!formData.name || !formData.email || !formData.phone || !formData.role) {
        toast.error('Please fill in all required fields')
        return
      }

      const url = editingStaff ? `/api/staff/${editingStaff.id}/update` : '/api/staff/create'
      const method = editingStaff ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
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
      location: staffMember.location || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (staffId: string) => {
    if (!confirm('Are you sure you want to deactivate this staff member?')) {
      return
    }

    try {
      const response = await fetch(`/api/staff/${staffId}/delete`, {
        method: 'DELETE'
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
      <div className="min-h-screen bg-background">
        <div className="border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Staff Management</h1>
                <p className="text-muted-foreground">
                  Manage team members and their roles
                </p>
              </div>
              <Button onClick={() => setShowForm(!showForm)} className="gap-2">
                <IconPlus className="h-4 w-4" />
                {showForm ? 'Cancel' : 'Add Staff'}
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staff.map((member) => (
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

                      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-lg font-bold text-primary">{member.performance.points}</p>
                          <p className="text-xs text-muted-foreground">Points</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold">{member.performance.tasks_completed}</p>
                          <p className="text-xs text-muted-foreground">Tasks</p>
                        </div>
                        <div>
                          <div className="flex justify-center">
                            {member.performance.badges.length > 0 ? (
                              <Badge variant="outline" className="text-xs">
                                {member.performance.badges[0].toUpperCase()}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">No Badge</span>
                            )}
                          </div>
                        </div>
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

          {staff.length === 0 && !showForm && (
            <Card>
              <CardContent className="text-center py-8">
                <IconUsers className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No staff members found</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Add your first team member to get started
                </p>
                <Button onClick={() => setShowForm(true)}>
                  <IconPlus className="h-4 w-4 mr-2" />
                  Add First Staff Member
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}