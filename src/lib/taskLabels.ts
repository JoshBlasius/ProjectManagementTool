import type { DependencyType, TaskPriority, TaskStatus } from '../types/database'

export function statusLabel(status: TaskStatus) {
  return { not_started: 'Not started', in_progress: 'In progress', blocked: 'Blocked', done: 'Done' }[status]
}

export function priorityLabel(priority: TaskPriority) {
  return { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' }[priority]
}

export function dependencyTypeLabel(type: DependencyType) {
  return {
    finish_to_start: 'Finish to start',
    start_to_start: 'Start to start',
    finish_to_finish: 'Finish to finish',
    start_to_finish: 'Start to finish',
  }[type]
}
