"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SuperAdminGuard } from '@/components/super-admin-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { IconLoader, IconUser, IconBuilding, IconSettings, IconCrown, IconCheck, IconAlertCircle } from '@tabler/icons-react'
import { toast } from 'sonner'

const states = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli',
  'Daman and Diu', 'Delhi', 'Lakshadweep', 'Puducherry'
]

const positions = [
  'Member of Parliament (MP)', 'Member of Legislative Assembly (MLA)',
  'Mayor', 'Deputy Mayor', 'Councillor', 'Sarpanch',
  'Ward Member', 'Zilla Panchayat Member', 'Block Development Officer',
  'Municipal Commissioner', 'Chief Minister', 'Minister',
  'Opposition Leader', 'Party President', 'Other'
]

export default function ClientOnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState('basic')
  
  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    email: '',
    phone: '',
    party: '',
    position: '',
    
    // Location Details
    state: '',
    district: '',
    constituency: '',
    
    // Profile
    bio: '',
    profile_image: '',
    
    // Social Media
    twitter: '',
    facebook: '',
    instagram: '',
    linkedin: '',
    
    // Settings
    task_auto_assign: true,
    email_notifications: true,
    sms_notifications: false,
    whatsapp_notifications: true,
    
    // Subscription
    subscription_tier: 'basic' as 'basic' | 'pro' | 'enterprise',
    subscription_months: 12,
    
    // Admin User
    admin_name: '',
    admin_email: '',
    admin_phone: '',
    admin_password: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateBasicInfo = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'
    else if (!/^\+?[1-9]\d{9,14}$/.test(formData.phone.replace(/[\s-]/g, ''))) {
      newErrors.phone = 'Invalid phone number'
    }
    if (!formData.position) newErrors.position = 'Position is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateAdminUser = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.admin_name.trim()) newErrors.admin_name = 'Admin name is required'
    if (!formData.admin_email.trim()) newErrors.admin_email = 'Admin email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.admin_email)) {
      newErrors.admin_email = 'Invalid email format'
    }
    if (!formData.admin_phone.trim()) newErrors.admin_phone = 'Admin phone is required'
    if (!formData.admin_password) newErrors.admin_password = 'Password is required'
    else if (formData.admin_password.length < 8) {
      newErrors.admin_password = 'Password must be at least 8 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleSubmit = async () => {
    // Validate all required fields
    const isBasicValid = validateBasicInfo()
    const isAdminValid = validateAdminUser()
    
    if (!isBasicValid || !isAdminValid) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    
    try {
      // Get the session token from Supabase
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      const response = await fetch('/api/politicians/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          politician: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            party: formData.party,
            position: formData.position,
            state: formData.state,
            district: formData.district,
            constituency: formData.constituency,
            bio: formData.bio,
            profile_image: formData.profile_image,
            social_media: {
              twitter: formData.twitter,
              facebook: formData.facebook,
              instagram: formData.instagram,
              linkedin: formData.linkedin
            },
            settings: {
              task_auto_assign: formData.task_auto_assign,
              email_notifications: formData.email_notifications,
              sms_notifications: formData.sms_notifications,
              whatsapp_notifications: formData.whatsapp_notifications
            },
            subscription_tier: formData.subscription_tier,
            subscription_months: formData.subscription_months
          },
          admin_user: {
            name: formData.admin_name,
            email: formData.admin_email,
            phone: formData.admin_phone,
            password: formData.admin_password
          }
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to onboard client')
      }

      const result = await response.json()
      
      toast.success('Client onboarded successfully!')
      
      // Redirect to clients list or show success page
      router.push('/admin/clients')
      
    } catch (error) {
      console.error('Onboarding error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to onboard client')
    } finally {
      setLoading(false)
    }
  }

  const subscriptionTiers = {
    basic: {
      name: 'Basic',
      price: '₹5,000',
      features: ['Up to 1,000 tasks/month', '2 staff accounts', 'Basic analytics', 'Email support']
    },
    pro: {
      name: 'Professional',
      price: '₹15,000',
      features: ['Up to 10,000 tasks/month', '10 staff accounts', 'Advanced analytics', 'Priority support', 'API access']
    },
    enterprise: {
      name: 'Enterprise',
      price: '₹50,000',
      features: ['Unlimited tasks', 'Unlimited staff', 'Custom analytics', 'Dedicated support', 'Full API access', 'Custom integrations']
    }
  }

  return (
    <SuperAdminGuard>
      <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Client Onboarding</h1>
            <p className="text-muted-foreground">
              Set up a new politician account with complete access controls
            </p>
          </div>
          <Badge variant="outline" className="gap-1">
            <IconCrown className="h-3 w-3" />
            Super Admin Only
          </Badge>
        </div>

        <Tabs value={currentStep} onValueChange={setCurrentStep} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Enter the politician's basic details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter politician's full name"
                      className={errors.name ? 'border-destructive' : ''}
                    />
                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="politician@example.com"
                      className={errors.email ? 'border-destructive' : ''}
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+91 98765 43210"
                      className={errors.phone ? 'border-destructive' : ''}
                    />
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="party">Political Party</Label>
                    <Input
                      id="party"
                      value={formData.party}
                      onChange={(e) => handleInputChange('party', e.target.value)}
                      placeholder="Party name"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="position">Position *</Label>
                    <Select value={formData.position} onValueChange={(value) => handleInputChange('position', value)}>
                      <SelectTrigger className={errors.position ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        {positions.map(pos => (
                          <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.position && <p className="text-xs text-destructive">{errors.position}</p>}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium mb-4">Admin User Account</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    This will be the primary administrator account for this politician
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin_name">Admin Name *</Label>
                      <Input
                        id="admin_name"
                        value={formData.admin_name}
                        onChange={(e) => handleInputChange('admin_name', e.target.value)}
                        placeholder="Admin full name"
                        className={errors.admin_name ? 'border-destructive' : ''}
                      />
                      {errors.admin_name && <p className="text-xs text-destructive">{errors.admin_name}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="admin_email">Admin Email *</Label>
                      <Input
                        id="admin_email"
                        type="email"
                        value={formData.admin_email}
                        onChange={(e) => handleInputChange('admin_email', e.target.value)}
                        placeholder="admin@example.com"
                        className={errors.admin_email ? 'border-destructive' : ''}
                      />
                      {errors.admin_email && <p className="text-xs text-destructive">{errors.admin_email}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="admin_phone">Admin Phone *</Label>
                      <Input
                        id="admin_phone"
                        value={formData.admin_phone}
                        onChange={(e) => handleInputChange('admin_phone', e.target.value)}
                        placeholder="+91 98765 43210"
                        className={errors.admin_phone ? 'border-destructive' : ''}
                      />
                      {errors.admin_phone && <p className="text-xs text-destructive">{errors.admin_phone}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="admin_password">Admin Password *</Label>
                      <Input
                        id="admin_password"
                        type="password"
                        value={formData.admin_password}
                        onChange={(e) => handleInputChange('admin_password', e.target.value)}
                        placeholder="Min 8 characters"
                        className={errors.admin_password ? 'border-destructive' : ''}
                      />
                      {errors.admin_password && <p className="text-xs text-destructive">{errors.admin_password}</p>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="location" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Location Details</CardTitle>
                <CardDescription>
                  Specify the politician's constituency and location
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state">State/UT</Label>
                    <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="district">District</Label>
                    <Input
                      id="district"
                      value={formData.district}
                      onChange={(e) => handleInputChange('district', e.target.value)}
                      placeholder="Enter district name"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="constituency">Constituency</Label>
                    <Input
                      id="constituency"
                      value={formData.constituency}
                      onChange={(e) => handleInputChange('constituency', e.target.value)}
                      placeholder="Enter constituency name or number"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Add bio and social media links
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bio">Biography</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Brief biography or description"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile_image">Profile Image URL</Label>
                  <Input
                    id="profile_image"
                    value={formData.profile_image}
                    onChange={(e) => handleInputChange('profile_image', e.target.value)}
                    placeholder="https://example.com/profile.jpg"
                  />
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium mb-4">Social Media Links</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="twitter">Twitter/X</Label>
                      <Input
                        id="twitter"
                        value={formData.twitter}
                        onChange={(e) => handleInputChange('twitter', e.target.value)}
                        placeholder="@username"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="facebook">Facebook</Label>
                      <Input
                        id="facebook"
                        value={formData.facebook}
                        onChange={(e) => handleInputChange('facebook', e.target.value)}
                        placeholder="facebook.com/username"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instagram">Instagram</Label>
                      <Input
                        id="instagram"
                        value={formData.instagram}
                        onChange={(e) => handleInputChange('instagram', e.target.value)}
                        placeholder="@username"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="linkedin">LinkedIn</Label>
                      <Input
                        id="linkedin"
                        value={formData.linkedin}
                        onChange={(e) => handleInputChange('linkedin', e.target.value)}
                        placeholder="linkedin.com/in/username"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  Configure default settings for the politician's account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-assign Tasks</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically assign tasks to available staff
                      </p>
                    </div>
                    <Switch
                      checked={formData.task_auto_assign}
                      onCheckedChange={(checked) => handleInputChange('task_auto_assign', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive email notifications for important events
                      </p>
                    </div>
                    <Switch
                      checked={formData.email_notifications}
                      onCheckedChange={(checked) => handleInputChange('email_notifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive SMS alerts for urgent tasks
                      </p>
                    </div>
                    <Switch
                      checked={formData.sms_notifications}
                      onCheckedChange={(checked) => handleInputChange('sms_notifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>WhatsApp Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive WhatsApp messages for task updates
                      </p>
                    </div>
                    <Switch
                      checked={formData.whatsapp_notifications}
                      onCheckedChange={(checked) => handleInputChange('whatsapp_notifications', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Plan</CardTitle>
                <CardDescription>
                  Choose a subscription tier and billing period
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(subscriptionTiers).map(([key, tier]) => (
                    <div
                      key={key}
                      className={`relative rounded-lg border p-4 cursor-pointer transition-colors ${
                        formData.subscription_tier === key 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handleInputChange('subscription_tier', key)}
                    >
                      {formData.subscription_tier === key && (
                        <div className="absolute top-2 right-2">
                          <IconCheck className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <h3 className="font-semibold">{tier.name}</h3>
                      <p className="text-2xl font-bold mt-2">{tier.price}<span className="text-sm font-normal">/month</span></p>
                      <ul className="mt-4 space-y-2">
                        {tier.features.map((feature, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <IconCheck className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t">
                  <Label htmlFor="subscription_months">Subscription Duration</Label>
                  <Select 
                    value={formData.subscription_months.toString()} 
                    onValueChange={(value) => handleInputChange('subscription_months', parseInt(value))}
                  >
                    <SelectTrigger className="w-full mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Month</SelectItem>
                      <SelectItem value="3">3 Months</SelectItem>
                      <SelectItem value="6">6 Months</SelectItem>
                      <SelectItem value="12">12 Months (10% discount)</SelectItem>
                      <SelectItem value="24">24 Months (20% discount)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/clients')}
            disabled={loading}
          >
            Cancel
          </Button>
          
          <div className="flex items-center gap-4">
            {currentStep !== 'basic' && (
              <Button
                variant="outline"
                onClick={() => {
                  const steps = ['basic', 'location', 'profile', 'settings', 'subscription']
                  const currentIndex = steps.indexOf(currentStep)
                  if (currentIndex > 0) {
                    setCurrentStep(steps[currentIndex - 1])
                  }
                }}
                disabled={loading}
              >
                Previous
              </Button>
            )}
            
            {currentStep !== 'subscription' ? (
              <Button
                onClick={() => {
                  const steps = ['basic', 'location', 'profile', 'settings', 'subscription']
                  const currentIndex = steps.indexOf(currentStep)
                  if (currentIndex < steps.length - 1) {
                    setCurrentStep(steps[currentIndex + 1])
                  }
                }}
                disabled={loading}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="min-w-[120px]"
              >
                {loading ? (
                  <>
                    <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                    Onboarding...
                  </>
                ) : (
                  'Complete Onboarding'
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </SuperAdminGuard>
  )
}