"use client"

import { AuthGuard } from '@/components/auth-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { IconPlus, IconEdit, IconTrash, IconPhone, IconMail, IconBrandWhatsapp, IconMessage, IconQrcode } from '@tabler/icons-react'

export default function TaskSourcePage() {
  const sources = [
    {
      id: 1,
      name: "QR Code Scan",
      type: "qr",
      icon: IconQrcode,
      status: "active",
      tasksReceived: 342,
      lastActive: "2 minutes ago"
    },
    {
      id: 2,
      name: "WhatsApp Bot",
      type: "whatsapp",
      icon: IconBrandWhatsapp,
      status: "active",
      tasksReceived: 1256,
      lastActive: "5 minutes ago"
    },
    {
      id: 3,
      name: "SMS Gateway",
      type: "sms",
      icon: IconMessage,
      status: "active",
      tasksReceived: 789,
      lastActive: "1 hour ago"
    },
    {
      id: 4,
      name: "Phone Call Center",
      type: "phone",
      icon: IconPhone,
      status: "inactive",
      tasksReceived: 456,
      lastActive: "2 days ago"
    },
    {
      id: 5,
      name: "Email Support",
      type: "email",
      icon: IconMail,
      status: "active",
      tasksReceived: 234,
      lastActive: "30 minutes ago"
    }
  ]

  return (
    <AuthGuard>
      <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Task Sources</h1>
            <p className="text-muted-foreground">
              Manage channels through which tasks are received
            </p>
          </div>
          <Button className="gap-2">
            <IconPlus className="h-4 w-4" />
            Add Source
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {sources.map((source) => {
            const Icon = source.icon
            return (
              <Card key={source.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <Badge variant={source.status === 'active' ? 'default' : 'secondary'}>
                      {source.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="font-semibold text-sm">{source.name}</h3>
                  <p className="text-2xl font-bold mt-1">{source.tasksReceived}</p>
                  <p className="text-xs text-muted-foreground">Total tasks</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Source Configuration</CardTitle>
            <CardDescription>
              Configure and manage task intake channels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tasks Received</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources.map((source) => {
                  const Icon = source.icon
                  return (
                    <TableRow key={source.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          {source.name}
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{source.type}</TableCell>
                      <TableCell>
                        <Badge variant={source.status === 'active' ? 'default' : 'secondary'}>
                          {source.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{source.tasksReceived.toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{source.lastActive}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <IconEdit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <IconTrash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  )
}