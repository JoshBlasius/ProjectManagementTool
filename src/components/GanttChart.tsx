import { useEffect, useRef } from 'react'
import Gantt, { type GanttTask } from 'frappe-gantt'
// frappe-gantt's package.json `exports` only exposes the "." entry point,
// so its dist CSS can't be imported by path — it's vendored locally instead
// (see src/styles/frappe-gantt.css for details, and re-sync it on upgrades).
import '../styles/frappe-gantt.css'
import type { DependencyRow, TaskRow } from '../types/database'

interface GanttChartProps {
  tasks: TaskRow[]
  dependencies: DependencyRow[]
  onDateChange: (taskId: string, startDate: string, endDate: string) => void
  onProgressChange: (taskId: string, progress: number) => void
}

function toDateInput(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function GanttChart({ tasks, dependencies, onDateChange, onProgressChange }: GanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const ganttRef = useRef<Gantt | null>(null)
  // Keep the latest callbacks in a ref so the effect below doesn't need to
  // re-create the Gantt instance (and lose its internal state) just because
  // a parent re-render produced new function identities.
  const callbacksRef = useRef({ onDateChange, onProgressChange })
  callbacksRef.current = { onDateChange, onProgressChange }

  const scheduledTasks = tasks.filter((t) => t.start_date && t.end_date)
  const unscheduledCount = tasks.length - scheduledTasks.length

  const ganttTasks: GanttTask[] = scheduledTasks.map((t) => ({
    id: t.id,
    name: t.name,
    start: t.start_date!,
    end: t.end_date!,
    progress: t.percent_complete,
    dependencies: dependencies
      .filter((d) => d.task_id === t.id)
      .map((d) => d.depends_on_task_id)
      .join(','),
  }))
  const ganttTasksKey = JSON.stringify(ganttTasks)

  useEffect(() => {
    if (!containerRef.current || ganttTasks.length === 0) return

    if (!ganttRef.current) {
      ganttRef.current = new Gantt(containerRef.current, ganttTasks, {
        view_mode: 'Week',
        // Dependencies are visual-only in v1 — dragging a task must never
        // shift the dates of tasks that depend on it.
        move_dependencies: false,
        on_date_change: (task, start, end) => {
          callbacksRef.current.onDateChange(task.id, toDateInput(start), toDateInput(end))
        },
        on_progress_change: (task, progress) => {
          callbacksRef.current.onProgressChange(task.id, Math.round(progress))
        },
      })
    } else {
      ganttRef.current.refresh(ganttTasks)
    }
    // Deliberately keyed on the stringified content, not `ganttTasks` itself:
    // that array is a fresh reference every render, and refreshing the
    // underlying Gantt instance on every unrelated re-render causes visible
    // flicker for no reason.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ganttTasksKey])

  return (
    <div>
      {unscheduledCount > 0 && (
        <p className="mb-2 text-sm text-gray-500">
          {unscheduledCount} task{unscheduledCount === 1 ? '' : 's'} hidden — missing a start or end date.
        </p>
      )}
      {ganttTasks.length === 0 && (
        <p className="text-sm text-gray-500">No tasks with both a start and end date yet.</p>
      )}
      <div
        ref={containerRef}
        className={
          ganttTasks.length === 0 ? 'hidden' : 'overflow-x-auto rounded-lg border border-gray-200 bg-white'
        }
      />
    </div>
  )
}
