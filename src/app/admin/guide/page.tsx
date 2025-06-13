"use client"

import { AuthGuard } from '@/components/auth-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  IconUsers, 
  IconListDetails, 
  IconCamera, 
  IconChartBar, 
  IconFileDescription,
  IconPhone,
  IconMessageCircle,
  IconQrcode,
  IconEdit,
  IconExternalLink,
  IconArrowRight
} from '@tabler/icons-react'
import Link from 'next/link'

export default function GuidePage() {
  const features = [
    {
      title: "Dashboard",
      description: "Overview of system metrics, tasks, and performance",
      icon: IconChartBar,
      url: "/dashboard",
      color: "bg-blue-100 text-blue-600",
      features: ["Task statistics", "Performance metrics", "Recent activities"]
    },
    {
      title: "Grievances Management",
      description: "Manually create and manage voter grievances",
      icon: IconListDetails,
      url: "/admin/grievances",
      color: "bg-green-100 text-green-600",
      features: ["Manual entry form", "Grievance tracking", "Status updates", "Assignment to staff"]
    },
    {
      title: "Staff Management",
      description: "Add, edit, and manage team members",
      icon: IconUsers,
      url: "/admin/staff",
      color: "bg-purple-100 text-purple-600",
      features: ["Add/edit staff", "Role management", "Performance tracking", "Contact details"]
    },
    {
      title: "QR Code Generator",
      description: "Create QR codes for public grievance submission",
      icon: IconCamera,
      url: "/admin/qr-generator",
      color: "bg-orange-100 text-orange-600",
      features: ["Location-specific QRs", "Category-based codes", "Downloadable images", "Form pre-filling"]
    },
    {
      title: "Leaderboard",
      description: "Gamified performance tracking and staff ranking",
      icon: IconChartBar,
      url: "/admin/leaderboard",
      color: "bg-yellow-100 text-yellow-600",
      features: ["Top performers", "Points system", "Badge achievements", "Performance analytics"]
    },
    {
      title: "SOPs (Workflows)",
      description: "Create step-by-step procedures for different grievance types",
      icon: IconFileDescription,
      url: "/admin/sops",
      color: "bg-indigo-100 text-indigo-600",
      features: ["Workflow builder", "Step-by-step processes", "Time estimates", "Auto-assignment"]
    }
  ]

  const channels = [
    {
      title: "WhatsApp Bot",
      description: "Voters send messages, images, or voice notes to WhatsApp",
      icon: IconMessageCircle,
      webhook: "/api/webhooks/whatsapp",
      color: "bg-green-500",
      setup: ["Configure WhatsApp Business API", "Set webhook URL", "Add phone number"]
    },
    {
      title: "Voice Bot (Twilio)",
      description: "Voters call a number and follow voice prompts",
      icon: IconPhone,
      webhook: "/api/webhooks/twilio-voice",
      color: "bg-blue-500",
      setup: ["Configure Twilio account", "Set webhook URL", "Configure phone number"]
    },
    {
      title: "QR Code Forms",
      description: "Voters scan QR codes and fill web forms",
      icon: IconQrcode,
      webhook: "/grievance-form",
      color: "bg-purple-500",
      setup: ["Generate QR codes", "Print and distribute", "Place at public locations"]
    },
    {
      title: "Manual Entry",
      description: "Staff manually enter grievances on behalf of voters",
      icon: IconEdit,
      webhook: "/admin/grievances",
      color: "bg-orange-500",
      setup: ["Train staff on portal", "Assign roles", "Start logging grievances"]
    }
  ]

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <div className="border-b">
          <div className="container mx-auto px-4 py-6">
            <div>
              <h1 className="text-3xl font-bold">Democratiq Admin Guide</h1>
              <p className="text-muted-foreground">
                Complete guide to using all features in your grievance management system
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 space-y-8">
          {/* Quick Start */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">🚀 Quick Start</CardTitle>
              <CardDescription>
                Get started with Democratiq in 5 simple steps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl mb-2">1️⃣</div>
                  <h4 className="font-medium">Add Staff</h4>
                  <p className="text-sm text-muted-foreground">Create team member accounts</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl mb-2">2️⃣</div>
                  <h4 className="font-medium">Create SOPs</h4>
                  <p className="text-sm text-muted-foreground">Define workflows for grievance types</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl mb-2">3️⃣</div>
                  <h4 className="font-medium">Generate QR Codes</h4>
                  <p className="text-sm text-muted-foreground">Create and distribute QR codes</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl mb-2">4️⃣</div>
                  <h4 className="font-medium">Configure Channels</h4>
                  <p className="text-sm text-muted-foreground">Set up WhatsApp & voice bots</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl mb-2">5️⃣</div>
                  <h4 className="font-medium">Start Receiving</h4>
                  <p className="text-sm text-muted-foreground">Begin managing grievances</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Features */}
          <div>
            <h2 className="text-2xl font-bold mb-6">📋 Admin Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <Card key={feature.title} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${feature.color}`}>
                        <feature.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                      </div>
                    </div>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm mb-2">Key Features:</h4>
                        <ul className="space-y-1">
                          {feature.features.map((feat, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                              <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                              {feat}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Link href={feature.url}>
                        <Button className="w-full" size="sm">
                          Open {feature.title}
                          <IconArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Grievance Channels */}
          <div>
            <h2 className="text-2xl font-bold mb-6">📞 Grievance Input Channels</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {channels.map((channel) => (
                <Card key={channel.title}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg text-white ${channel.color}`}>
                        <channel.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{channel.title}</CardTitle>
                        <Badge variant="outline" className="text-xs mt-1">
                          {channel.webhook}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>{channel.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <h4 className="font-medium text-sm mb-2">Setup Steps:</h4>
                      <ul className="space-y-1">
                        {channel.setup.map((step, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                            <Badge variant="outline" className="text-xs w-6 h-6 p-0 flex items-center justify-center">
                              {index + 1}
                            </Badge>
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Public URLs */}
          <Card>
            <CardHeader>
              <CardTitle>🌐 Public URLs for Voters</CardTitle>
              <CardDescription>
                Share these URLs with voters for direct access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium flex items-center gap-2">
                    <IconQrcode className="h-4 w-4" />
                    Grievance Form
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">Direct link to grievance submission form</p>
                  <code className="text-xs bg-muted p-2 rounded block">
                    {typeof window !== 'undefined' ? window.location.origin : 'https://yourapp.com'}/grievance-form
                  </code>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium flex items-center gap-2">
                    <IconExternalLink className="h-4 w-4" />
                    Grievance Success
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">Confirmation page after submission</p>
                  <code className="text-xs bg-muted p-2 rounded block">
                    {typeof window !== 'undefined' ? window.location.origin : 'https://yourapp.com'}/grievance-success
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Endpoints */}
          <Card>
            <CardHeader>
              <CardTitle>🔗 API Endpoints</CardTitle>
              <CardDescription>
                Technical endpoints for integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">Webhooks:</h4>
                    <ul className="space-y-1 text-sm">
                      <li><code>/api/webhooks/whatsapp</code> - WhatsApp integration</li>
                      <li><code>/api/webhooks/twilio-voice</code> - Voice bot</li>
                      <li><code>/api/webhooks/twilio-transcription</code> - Transcription</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2">Management APIs:</h4>
                    <ul className="space-y-1 text-sm">
                      <li><code>/api/tasks/create</code> - Create grievance</li>
                      <li><code>/api/staff/list</code> - Get staff list</li>
                      <li><code>/api/sops/create</code> - Create workflow</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}