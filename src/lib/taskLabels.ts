import type { TaskPriority, TaskStatus } from '../types/database'

export function statusLabel(status: TaskStatus) {
  return { not_started: 'Not started', in_progress: 'In progress', blocked: 'Blocked', done: 'Done' }[status]
}

export function priorityLabel(priority: TaskPriority) {
  return { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' }[priority]
}
