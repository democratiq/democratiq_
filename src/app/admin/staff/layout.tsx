"use client"

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { IconUsers, IconChartBar } from '@tabler/icons-react'
import { cn } from '@/lib/utils'

const staffNavItems = [
  {
    title: 'Staff Management',
    href: '/admin/staff',
    icon: IconUsers,
    description: 'Manage team members and their roles'
  },
  {
    title: 'Analytics',
    href: '/admin/staff/analytics',
    icon: IconChartBar,
    description: 'Employee performance and insights'
  }
]

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Staff</h1>
              <p className="text-muted-foreground">
                Manage your team and track performance
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Navigation */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1 py-4">
            {staffNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || 
                (item.href !== '/admin/staff' && pathname.startsWith(item.href))
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className={cn(
                      'gap-2 justify-start',
                      isActive && 'bg-primary text-primary-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.title}
                  </Button>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  )
}