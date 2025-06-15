"use client"

import { useState, useEffect } from 'react'
import { AuthGuard } from '@/components/auth-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  IconTrophy, 
  IconMedal, 
  IconStar, 
  IconTrendingUp, 
  IconChartBar,
  IconUsers,
  IconClock,
  IconTarget,
  IconFlame,
  IconAward,
  IconThumbUp,
  IconThumbDown,
  IconBuilding,
  IconCalendar,
  IconCrown,
  IconBolt,
  IconHeart,
  IconCheckbox
} from '@tabler/icons-react'
import { PageLoader } from '@/components/page-loader'

// Mock data - replace with real API calls
const mockEmployeeLeaderboard = [
  {
    id: 1,
    name: 'Rajesh Kumar',
    avatar: '/avatars/rajesh.jpg',
    department: 'Customer Service',
    tasksCompleted: 156,
    avgResolutionTime: 1.2,
    slaCompliance: 98,
    npsScore: 9.2,
    points: 2840,
    rank: 1,
    badges: ['Speed Demon', 'Customer Champion', 'Quality Expert'],
    streak: 15,
    thisMonth: { completed: 42, efficiency: 95 }
  },
  {
    id: 2,
    name: 'Priya Sharma',
    avatar: '/avatars/priya.jpg',
    department: 'Technical Support',
    tasksCompleted: 134,
    avgResolutionTime: 1.8,
    slaCompliance: 96,
    npsScore: 8.9,
    points: 2650,
    rank: 2,
    badges: ['Problem Solver', 'Team Player'],
    streak: 12,
    thisMonth: { completed: 38, efficiency: 92 }
  },
  {
    id: 3,
    name: 'Amit Patel',
    avatar: '/avatars/amit.jpg',
    department: 'Infrastructure',
    tasksCompleted: 128,
    avgResolutionTime: 2.1,
    slaCompliance: 94,
    npsScore: 8.7,
    points: 2580,
    rank: 3,
    badges: ['Infrastructure Hero', 'Reliable'],
    streak: 8,
    thisMonth: { completed: 35, efficiency: 89 }
  },
  {
    id: 4,
    name: 'Sneha Desai',
    avatar: '/avatars/sneha.jpg',
    department: 'Customer Service',
    tasksCompleted: 119,
    avgResolutionTime: 1.6,
    slaCompliance: 93,
    npsScore: 8.5,
    points: 2420,
    rank: 4,
    badges: ['Rising Star', 'Communicator'],
    streak: 6,
    thisMonth: { completed: 32, efficiency: 86 }
  },
  {
    id: 5,
    name: 'Vikram Singh',
    avatar: '/avatars/vikram.jpg',
    department: 'Field Operations',
    tasksCompleted: 98,
    avgResolutionTime: 3.2,
    slaCompliance: 91,
    npsScore: 8.3,
    points: 2180,
    rank: 5,
    badges: ['Field Expert'],
    streak: 4,
    thisMonth: { completed: 28, efficiency: 84 }
  }
]

const mockDepartmentStats = [
  {
    name: 'Customer Service',
    totalTasks: 445,
    completed: 389,
    avgResolutionTime: 1.5,
    slaCompliance: 96,
    npsScore: 8.8,
    efficiency: 87,
    employees: 12
  },
  {
    name: 'Technical Support',
    totalTasks: 312,
    completed: 278,
    avgResolutionTime: 2.3,
    slaCompliance: 92,
    npsScore: 8.5,
    efficiency: 89,
    employees: 8
  },
  {
    name: 'Infrastructure',
    totalTasks: 198,
    completed: 176,
    avgResolutionTime: 3.1,
    slaCompliance: 89,
    npsScore: 8.2,
    efficiency: 88,
    employees: 6
  },
  {
    name: 'Field Operations',
    totalTasks: 156,
    completed: 134,
    avgResolutionTime: 4.2,
    slaCompliance: 86,
    npsScore: 7.9,
    efficiency: 86,
    employees: 10
  }
]

const mockGamificationData = {
  topPerformers: [
    { name: 'Rajesh Kumar', points: 2840, badge: 'Gold Champion' },
    { name: 'Priya Sharma', points: 2650, badge: 'Silver Star' },
    { name: 'Amit Patel', points: 2580, badge: 'Bronze Hero' }
  ],
  achievements: [
    { icon: IconFlame, title: 'Hot Streak', description: '15+ consecutive days active', count: 3 },
    { icon: IconTarget, title: 'Bulls Eye', description: '100% SLA compliance', count: 8 },
    { icon: IconBolt, title: 'Speed Demon', description: 'Fastest resolution time', count: 5 },
    { icon: IconHeart, title: 'Customer Love', description: 'NPS score >9.0', count: 12 }
  ],
  monthlyChallenge: {
    title: 'November Excellence Challenge',
    description: 'Complete 50+ tasks with 95%+ efficiency',
    participants: 28,
    completed: 12,
    daysLeft: 8
  }
}

export default function StaffAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30')

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <AuthGuard>
        <PageLoader text="Loading staff analytics..." />
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Staff Analytics</h2>
            <p className="text-muted-foreground">
              Employee performance, gamification, and team insights
            </p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="leaderboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="leaderboard">Employee Leaderboard</TabsTrigger>
            <TabsTrigger value="departments">Department Analysis</TabsTrigger>
            <TabsTrigger value="gamification">Gamification</TabsTrigger>
            <TabsTrigger value="insights">Performance Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboard" className="space-y-6">
            {/* Top Performers Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {mockEmployeeLeaderboard.slice(0, 3).map((employee, index) => (
                <Card key={employee.id} className={index === 0 ? 'ring-2 ring-yellow-400' : ''}>
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-2">
                      {index === 0 && <IconCrown className="h-8 w-8 text-yellow-500 mx-auto mb-2" />}
                      {index === 1 && <IconMedal className="h-8 w-8 text-gray-400 mx-auto mb-2" />}
                      {index === 2 && <IconAward className="h-8 w-8 text-amber-600 mx-auto mb-2" />}
                    </div>
                    <Avatar className="h-16 w-16 mx-auto">
                      <AvatarImage src={employee.avatar} />
                      <AvatarFallback>{employee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-lg">{employee.name}</CardTitle>
                    <CardDescription>{employee.department}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{employee.points}</div>
                      <div className="text-sm text-muted-foreground">Points</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="font-semibold">{employee.tasksCompleted}</div>
                        <div className="text-xs text-muted-foreground">Tasks</div>
                      </div>
                      <div>
                        <div className="font-semibold">{employee.streak}</div>
                        <div className="text-xs text-muted-foreground">Day Streak</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {employee.badges.slice(0, 2).map((badge, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {badge}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Detailed Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconTrophy className="h-5 w-5" />
                  Complete Leaderboard
                </CardTitle>
                <CardDescription>
                  Ranked by overall performance score
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Tasks</TableHead>
                      <TableHead>Avg Time</TableHead>
                      <TableHead>SLA</TableHead>
                      <TableHead>NPS</TableHead>
                      <TableHead>Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockEmployeeLeaderboard.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">#{employee.rank}</span>
                            {employee.rank <= 3 && (
                              <IconStar className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={employee.avatar} />
                              <AvatarFallback className="text-xs">
                                {employee.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{employee.name}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <IconFlame className="h-3 w-3" />
                                {employee.streak} day streak
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{employee.department}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{employee.tasksCompleted}</div>
                            <div className="text-sm text-muted-foreground">
                              {employee.thisMonth.completed} this month
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <IconClock className="h-4 w-4 text-muted-foreground" />
                            {employee.avgResolutionTime}h
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={employee.slaCompliance} className="w-16 h-2" />
                            <span className="text-sm">{employee.slaCompliance}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <IconStar className="h-4 w-4 text-yellow-500" />
                            {employee.npsScore}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-primary">{employee.points}</div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments" className="space-y-6">
            {/* Department Performance Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {mockDepartmentStats.map((dept, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{dept.name}</CardTitle>
                      <IconBuilding className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <CardDescription>{dept.employees} employees</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Task Completion</span>
                        <span>{Math.round((dept.completed / dept.totalTasks) * 100)}%</span>
                      </div>
                      <Progress value={(dept.completed / dept.totalTasks) * 100} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="font-semibold">{dept.avgResolutionTime}h</div>
                        <div className="text-xs text-muted-foreground">Avg Time</div>
                      </div>
                      <div>
                        <div className="font-semibold">{dept.slaCompliance}%</div>
                        <div className="text-xs text-muted-foreground">SLA</div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-primary">{dept.npsScore}</div>
                      <div className="text-xs text-muted-foreground">NPS Score</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Department Comparison Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconChartBar className="h-5 w-5" />
                  Department Comparison
                </CardTitle>
                <CardDescription>
                  Comprehensive performance metrics by department
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead>Total Tasks</TableHead>
                      <TableHead>Completion Rate</TableHead>
                      <TableHead>Avg Resolution</TableHead>
                      <TableHead>SLA Compliance</TableHead>
                      <TableHead>NPS Score</TableHead>
                      <TableHead>Efficiency</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockDepartmentStats.map((dept, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <IconBuilding className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{dept.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{dept.employees}</TableCell>
                        <TableCell>{dept.totalTasks}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={(dept.completed / dept.totalTasks) * 100} className="w-16 h-2" />
                            <span className="text-sm">{Math.round((dept.completed / dept.totalTasks) * 100)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{dept.avgResolutionTime}h</TableCell>
                        <TableCell>
                          <Badge variant={dept.slaCompliance >= 95 ? 'default' : dept.slaCompliance >= 90 ? 'secondary' : 'destructive'}>
                            {dept.slaCompliance}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <IconStar className="h-4 w-4 text-yellow-500" />
                            {dept.npsScore}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Progress value={dept.efficiency} className="w-16 h-2" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gamification" className="space-y-6">
            {/* Monthly Challenge */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconTarget className="h-5 w-5" />
                  {mockGamificationData.monthlyChallenge.title}
                </CardTitle>
                <CardDescription>
                  {mockGamificationData.monthlyChallenge.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">
                      {mockGamificationData.monthlyChallenge.participants}
                    </div>
                    <div className="text-sm text-muted-foreground">Participants</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {mockGamificationData.monthlyChallenge.completed}
                    </div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">
                      {mockGamificationData.monthlyChallenge.daysLeft}
                    </div>
                    <div className="text-sm text-muted-foreground">Days Left</div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>{Math.round((mockGamificationData.monthlyChallenge.completed / mockGamificationData.monthlyChallenge.participants) * 100)}%</span>
                  </div>
                  <Progress value={(mockGamificationData.monthlyChallenge.completed / mockGamificationData.monthlyChallenge.participants) * 100} />
                </div>
              </CardContent>
            </Card>

            {/* Achievements & Badges */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {mockGamificationData.achievements.map((achievement, index) => (
                <Card key={index}>
                  <CardContent className="p-6 text-center">
                    <achievement.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                    <h3 className="font-semibold mb-2">{achievement.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{achievement.description}</p>
                    <div className="text-2xl font-bold text-primary">{achievement.count}</div>
                    <div className="text-xs text-muted-foreground">employees earned this</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Top Point Earners */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconTrophy className="h-5 w-5" />
                  Top Point Earners This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockGamificationData.topPerformers.map((performer, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold text-muted-foreground">#{index + 1}</div>
                        <div>
                          <div className="font-medium">{performer.name}</div>
                          <Badge variant="outline">{performer.badge}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-primary">{performer.points}</div>
                        <div className="text-sm text-muted-foreground">points</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            {/* Performance Insights Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg NPS Score</p>
                      <p className="text-2xl font-bold">8.6</p>
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <IconTrendingUp className="h-3 w-3" />
                        +0.3 from last month
                      </p>
                    </div>
                    <IconThumbUp className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Employee Efficiency</p>
                      <p className="text-2xl font-bold">87%</p>
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <IconTrendingUp className="h-3 w-3" />
                        +2% from last month
                      </p>
                    </div>
                    <IconTarget className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Resolution Time</p>
                      <p className="text-2xl font-bold">2.1h</p>
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <IconTrendingUp className="h-3 w-3 rotate-180" />
                        +0.2h from last month
                      </p>
                    </div>
                    <IconClock className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Streaks</p>
                      <p className="text-2xl font-bold">18</p>
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <IconFlame className="h-3 w-3" />
                        employees on streak
                      </p>
                    </div>
                    <IconFlame className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Satisfaction Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Satisfaction Breakdown</CardTitle>
                  <CardDescription>NPS distribution across departments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockDepartmentStats.map((dept, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">{dept.name}</span>
                        <span className="text-sm font-medium">{dept.npsScore}/10</span>
                      </div>
                      <Progress value={dept.npsScore * 10} />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Training Recommendations</CardTitle>
                  <CardDescription>Areas for improvement</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <IconCheckbox className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Communication Skills</div>
                      <div className="text-sm text-muted-foreground">
                        3 employees could benefit from advanced communication training
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <IconCheckbox className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Technical Proficiency</div>
                      <div className="text-sm text-muted-foreground">
                        Infrastructure team needs updated technical training
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <IconCheckbox className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Time Management</div>
                      <div className="text-sm text-muted-foreground">
                        Focus on reducing average resolution times
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  )
}