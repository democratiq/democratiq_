"use client"

import { useState, useEffect } from 'react'
import { AuthGuard } from '@/components/auth-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { IconTrophy, IconMedal, IconAward, IconUsers, IconTarget, IconClock } from '@tabler/icons-react'
import { Staff } from '@/lib/database-types'

export default function LeaderboardPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)

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

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <IconTrophy className="h-6 w-6 text-yellow-500" />
      case 2:
        return <IconMedal className="h-6 w-6 text-gray-400" />
      case 3:
        return <IconAward className="h-6 w-6 text-amber-600" />
      default:
        return <span className="h-6 w-6 flex items-center justify-center text-sm font-bold text-muted-foreground">#{position}</span>
    }
  }

  const getBadgeVariant = (badge: string) => {
    switch (badge) {
      case 'gold':
        return 'default'
      case 'silver':
        return 'secondary'
      case 'bronze':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'gold':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'silver':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      case 'bronze':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
      default:
        return ''
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  const topPerformers = staff.slice(0, 10)
  const totalStaff = staff.length
  const totalPoints = staff.reduce((sum, member) => sum + member.performance.points, 0)
  const totalTasks = staff.reduce((sum, member) => sum + member.performance.tasks_completed, 0)

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading leaderboard...</p>
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
            <div>
              <h1 className="text-3xl font-bold">Staff Leaderboard</h1>
              <p className="text-muted-foreground">
                Performance tracking and gamification dashboard
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <IconUsers className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Active Staff</p>
                    <p className="text-2xl font-bold">{totalStaff}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <IconTarget className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Points</p>
                    <p className="text-2xl font-bold">{totalPoints}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <IconClock className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tasks Completed</p>
                    <p className="text-2xl font-bold">{totalTasks}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconTrophy className="h-5 w-5 text-yellow-500" />
                Top Performers
              </CardTitle>
              <CardDescription>
                Staff members ranked by performance points
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topPerformers.length > 0 ? (
                <div className="space-y-4">
                  {topPerformers.map((member, index) => (
                    <div
                      key={member.id}
                      className={`flex items-center space-x-4 p-4 rounded-lg border ${
                        index < 3 ? 'bg-muted/50' : ''
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {getPositionIcon(index + 1)}
                      </div>

                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`} />
                        <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium truncate">{member.name}</p>
                          <Badge variant="outline" className="text-xs">
                            {member.role}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {member.email}
                        </p>
                        {member.location && (
                          <p className="text-xs text-muted-foreground">
                            📍 {member.location}
                          </p>
                        )}
                      </div>

                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">
                          {member.performance.points}
                        </p>
                        <p className="text-xs text-muted-foreground">points</p>
                      </div>

                      <div className="text-center">
                        <p className="text-lg font-semibold">
                          {member.performance.tasks_completed}
                        </p>
                        <p className="text-xs text-muted-foreground">tasks</p>
                      </div>

                      <div className="flex flex-col space-y-1">
                        {member.performance.badges.map((badge) => (
                          <Badge
                            key={badge}
                            variant={getBadgeVariant(badge)}
                            className={`text-xs ${getBadgeColor(badge)}`}
                          >
                            {badge.toUpperCase()}
                          </Badge>
                        ))}
                        {member.performance.badges.length === 0 && (
                          <Badge variant="outline" className="text-xs">
                            NO BADGE
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <IconUsers className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No staff members found</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Badge System Info */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Badge System</CardTitle>
              <CardDescription>
                Achievement levels based on performance points
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3 p-3 rounded-lg border">
                  <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                    BRONZE
                  </Badge>
                  <div>
                    <p className="font-medium">Bronze Level</p>
                    <p className="text-sm text-muted-foreground">20+ points</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg border">
                  <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                    SILVER
                  </Badge>
                  <div>
                    <p className="font-medium">Silver Level</p>
                    <p className="text-sm text-muted-foreground">50+ points</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg border">
                  <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    GOLD
                  </Badge>
                  <div>
                    <p className="font-medium">Gold Level</p>
                    <p className="text-sm text-muted-foreground">100+ points</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Point System</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Low Priority Task: <strong>5 points</strong></li>
                  <li>• Medium Priority Task: <strong>10 points</strong></li>
                  <li>• High Priority Task: <strong>20 points</strong></li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}