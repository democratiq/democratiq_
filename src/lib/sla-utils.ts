import { Task, TaskWithSLA } from './database-types'

export function calculateSLAStatus(task: Task): TaskWithSLA {
  if (!task.deadline) {
    return {
      ...task,
      sla_status: 'within_sla' as const,
      days_remaining: undefined,
      hours_remaining: undefined
    }
  }

  const now = new Date()
  const deadline = new Date(task.deadline)
  const timeDiff = deadline.getTime() - now.getTime()
  
  // If deadline has passed
  if (timeDiff <= 0) {
    return {
      ...task,
      sla_status: 'overdue' as const,
      days_remaining: 0,
      hours_remaining: 0
    }
  }

  const daysRemaining = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
  const hoursRemaining = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  
  // If less than 24 hours remaining
  if (daysRemaining === 0 && hoursRemaining <= 24) {
    return {
      ...task,
      sla_status: 'approaching_sla' as const,
      days_remaining: daysRemaining,
      hours_remaining: hoursRemaining
    }
  }

  // If less than 2 days remaining
  if (daysRemaining <= 1) {
    return {
      ...task,
      sla_status: 'approaching_sla' as const,
      days_remaining: daysRemaining,
      hours_remaining: hoursRemaining
    }
  }

  return {
    ...task,
    sla_status: 'within_sla' as const,
    days_remaining: daysRemaining,
    hours_remaining: hoursRemaining
  }
}

export function getSLABadgeVariant(slaStatus: TaskWithSLA['sla_status']) {
  switch (slaStatus) {
    case 'within_sla':
      return 'default'
    case 'approaching_sla':
      return 'secondary'
    case 'overdue':
      return 'destructive'
    default:
      return 'outline'
  }
}

export function getSLAText(taskWithSLA: TaskWithSLA): string {
  switch (taskWithSLA.sla_status) {
    case 'overdue':
      return 'Overdue'
    case 'approaching_sla':
      if (taskWithSLA.days_remaining === 0) {
        return `${taskWithSLA.hours_remaining}h left`
      }
      return `${taskWithSLA.days_remaining}d ${taskWithSLA.hours_remaining}h left`
    case 'within_sla':
      if (taskWithSLA.days_remaining === 0) {
        return `${taskWithSLA.hours_remaining}h left`
      }
      return `${taskWithSLA.days_remaining}d left`
    default:
      return 'No deadline'
  }
}