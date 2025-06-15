"use client"

import { useState, useEffect } from 'react'
import { AuthGuard } from '@/components/auth-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  IconTrendingUp, 
  IconChartBar,
  IconClock,
  IconTarget,
  IconCheckbox,
  IconCalendar,
  IconFolder,
  IconSettings,
  IconTags,
  IconList,
  IconArrowUp,
  IconArrowDown,
  IconMinus
} from '@tabler/icons-react'
import { PageLoader } from '@/components/page-loader'

// Mock task analytics data
const mockTaskStats = {
  totalTasks: 1247,
  completedTasks: 892,
  pendingTasks: 278,
  overdueAasks: 77,
  avgCompletionTime: 2.3,
  slaCompliance: 91,
  completionRate: 71.5,
  thisMonthTasks: 184
}

const mockCategoryStats = [
  {
    id: 1,
    name: 'Infrastructure Issues',
    totalTasks: 342,
    completed: 298,
    pending: 32,
    overdue: 12,
    avgTime: 4.2,
    priority: 'high',
    trend: 'up'
  },
  {
    id: 2,
    name: 'Public Services',
    totalTasks: 289,
    completed: 245,
    pending: 31,
    overdue: 13,
    avgTime: 2.1,
    priority: 'medium',
    trend: 'down'
  },
  {
    id: 3,
    name: 'Administrative',
    totalTasks: 234,
    completed: 189,
    pending: 28,
    overdue: 17,
    avgTime: 1.8,
    priority: 'medium',
    trend: 'up'
  },
  {
    id: 4,
    name: 'Emergency Response',
    totalTasks: 156,
    completed: 142,
    pending: 11,
    overdue: 3,
    avgTime: 0.8,
    priority: 'high',
    trend: 'stable'
  },
  {
    id: 5,
    name: 'General Inquiry',
    totalTasks: 226,
    completed: 218,
    pending: 6,
    overdue: 2,
    avgTime: 0.3,
    priority: 'low',
    trend: 'down'
  }
]

const mockWorkflowStats = [
  {
    name: 'Infrastructure Repair',
    totalSteps: 8,
    avgStepsCompleted: 7.2,
    completionRate: 90,
    avgTimePerStep: 0.5,
    totalTasks: 156
  },
  {
    name: 'Public Service Request',
    totalSteps: 5,
    avgStepsCompleted: 4.8,
    completionRate: 96,
    avgTimePerStep: 0.4,
    totalTasks: 203
  },
  {
    name: 'Emergency Protocol',
    totalSteps: 4,
    avgStepsCompleted: 3.9,
    completionRate: 98,
    avgTimePerStep: 0.2,
    totalTasks: 89
  },
  {
    name: 'Administrative Process',
    totalSteps: 6,
    avgStepsCompleted: 5.4,
    completionRate: 90,
    avgTimePerStep: 0.3,
    totalTasks: 167
  }
]

const mockTrendData = [
  { period: 'Week 1', created: 45, completed: 38, overdue: 3 },
  { period: 'Week 2', created: 52, completed: 41, overdue: 5 },
  { period: 'Week 3', created: 38, completed: 45, overdue: 2 },
  { period: 'Week 4', created: 49, completed: 47, overdue: 4 }
]

export default function TasksAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30')

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <IconArrowUp className="h-4 w-4 text-green-600" />
      case 'down': return <IconArrowDown className="h-4 w-4 text-red-600" />
      default: return <IconMinus className="h-4 w-4 text-gray-400" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'outline'
    }
  }

  if (loading) {
    return (
      <AuthGuard>
        <PageLoader text="Loading task analytics..." />
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Task Analytics</h1>
            <p className="text-muted-foreground">
              Monitor task performance, completion rates, and workflow efficiency
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
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="workflow">Workflow Analysis</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Overall Task Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Tasks</p>
                      <p className="text-2xl font-bold">{mockTaskStats.totalTasks}</p>
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <IconTrendingUp className="h-3 w-3" />
                        +{mockTaskStats.thisMonthTasks} this month
                      </p>
                    </div>
                    <IconList className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold">{mockTaskStats.completedTasks}</p>
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <IconCheckbox className="h-3 w-3" />
                        {mockTaskStats.completionRate}% completion rate
                      </p>
                    </div>
                    <IconCheckbox className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Completion Time</p>
                      <p className="text-2xl font-bold">{mockTaskStats.avgCompletionTime}h</p>
                      <p className="text-xs text-orange-600 flex items-center gap-1">
                        <IconClock className="h-3 w-3" />
                        Target: 2.0h
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
                      <p className="text-sm text-muted-foreground">SLA Compliance</p>
                      <p className="text-2xl font-bold">{mockTaskStats.slaCompliance}%</p>
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <IconTarget className="h-3 w-3" />
                        Above target (90%)
                      </p>
                    </div>
                    <IconTarget className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Task Status Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Task Status Distribution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Completed</span>
                      <Badge variant="secondary">{mockTaskStats.completedTasks}</Badge>
                    </div>
                    <Progress value={(mockTaskStats.completedTasks / mockTaskStats.totalTasks) * 100} />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Pending</span>
                      <Badge variant="default">{mockTaskStats.pendingTasks}</Badge>
                    </div>
                    <Progress value={(mockTaskStats.pendingTasks / mockTaskStats.totalTasks) * 100} />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Overdue</span>
                      <Badge variant="destructive">{mockTaskStats.overdueAasks}</Badge>
                    </div>
                    <Progress value={(mockTaskStats.overdueAasks / mockTaskStats.totalTasks) * 100} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{mockTaskStats.completionRate}%</div>
                    <div className="text-sm text-muted-foreground">Completion Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{mockTaskStats.slaCompliance}%</div>
                    <div className="text-sm text-muted-foreground">SLA Compliance</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">{mockTaskStats.avgCompletionTime}h</div>
                    <div className="text-sm text-muted-foreground">Avg Resolution</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <IconFolder className="h-4 w-4" />
                    View Overdue Tasks
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <IconSettings className="h-4 w-4" />
                    Configure Workflows
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <IconTags className="h-4 w-4" />
                    Manage Categories
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconTags className="h-5 w-5" />
                  Category Performance Analysis
                </CardTitle>
                <CardDescription>
                  Performance metrics broken down by task categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Total Tasks</TableHead>
                      <TableHead>Completion Rate</TableHead>
                      <TableHead>Avg Time</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Trend</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockCategoryStats.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <div className="font-medium">{category.name}</div>
                        </TableCell>
                        <TableCell>{category.totalTasks}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={(category.completed / category.totalTasks) * 100} 
                              className="w-16 h-2" 
                            />
                            <span className="text-sm">
                              {Math.round((category.completed / category.totalTasks) * 100)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{category.avgTime}h</TableCell>
                        <TableCell>
                          <Badge variant={getPriorityColor(category.priority)}>
                            {category.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getTrendIcon(category.trend)}
                            <span className="text-sm capitalize">{category.trend}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            <div>Pending: {category.pending}</div>
                            <div>Overdue: {category.overdue}</div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workflow" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconSettings className="h-5 w-5" />
                  Workflow Efficiency Analysis
                </CardTitle>
                <CardDescription>
                  Performance metrics for different workflow types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Workflow Name</TableHead>
                      <TableHead>Total Steps</TableHead>
                      <TableHead>Avg Steps Completed</TableHead>
                      <TableHead>Completion Rate</TableHead>
                      <TableHead>Time per Step</TableHead>
                      <TableHead>Tasks Using</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockWorkflowStats.map((workflow, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="font-medium">{workflow.name}</div>
                        </TableCell>
                        <TableCell>{workflow.totalSteps}</TableCell>
                        <TableCell>{workflow.avgStepsCompleted}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={workflow.completionRate} className="w-16 h-2" />
                            <span className="text-sm">{workflow.completionRate}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{workflow.avgTimePerStep}h</TableCell>
                        <TableCell>
                          <Badge variant="outline">{workflow.totalTasks}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconChartBar className="h-5 w-5" />
                  Task Volume Trends
                </CardTitle>
                <CardDescription>
                  Weekly task creation and completion patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Overdue</TableHead>
                      <TableHead>Completion Rate</TableHead>
                      <TableHead>Net Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockTrendData.map((trend, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <IconCalendar className="h-4 w-4 text-muted-foreground" />
                            {trend.period}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">{trend.created}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{trend.completed}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive">{trend.overdue}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={(trend.completed / trend.created) * 100} 
                              className="w-16 h-2" 
                            />
                            <span className="text-sm">
                              {Math.round((trend.completed / trend.created) * 100)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {trend.completed > trend.created ? (
                              <IconArrowDown className="h-4 w-4 text-green-600" />
                            ) : (
                              <IconArrowUp className="h-4 w-4 text-red-600" />
                            )}
                            <span className="text-sm">
                              {Math.abs(trend.created - trend.completed)}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  )
}