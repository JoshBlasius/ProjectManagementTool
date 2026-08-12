import { useEffect, useRef, useState } from 'react'
import Gantt, { type GanttTask } from 'frappe-gantt'
// frappe-gantt's package.json `exports` only exposes the "." entry point,
// so its dist CSS can't be imported by path — it's vendored locally instead
// (see src/styles/frappe-gantt.css for details, and re-sync it on upgrades).
import '../styles/frappe-gantt.css'
import { contrastTextColor } from '../lib/color'
import { escapeHtml } from '../lib/escapeHtml'
import type { DependencyRow, FlagOptionRow, FlagRow, TaskRow } from '../types/database'

interface GanttChartProps {
  tasks: TaskRow[]
  dependencies: DependencyRow[]
  flags: FlagRow[]
  flagOptions: FlagOptionRow[]
  taskFlagsByTaskId: Map<string, string[]>
  onDateChange: (taskId: string, startDate: string, endDate: string) => void
  onProgressChange: (taskId: string, progress: number) => void
}

function toDateInput(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function GanttChart({
  tasks,
  dependencies,
  flags,
  flagOptions,
  taskFlagsByTaskId,
  onDateChange,
  onProgressChange,
}: GanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const ganttRef = useRef<Gantt | null>(null)
  const [flagFilter, setFlagFilter] = useState<string[]>([])

  // Keep the latest callbacks/data in a ref so the effect below doesn't need
  // to re-create the Gantt instance (and lose its internal state) just
  // because a parent re-render produced new function/array identities.
  const liveRef = useRef({ onDateChange, onProgressChange, flagOptions, taskFlagsByTaskId })
  liveRef.current = { onDateChange, onProgressChange, flagOptions, taskFlagsByTaskId }

  const filteredTasks =
    flagFilter.length === 0
      ? tasks
      : tasks.filter((t) => (taskFlagsByTaskId.get(t.id) ?? []).some((id) => flagFilter.includes(id)))

  const scheduledTasks = filteredTasks.filter((t) => t.start_date && t.end_date)
  const unscheduledCount = filteredTasks.length - scheduledTasks.length

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
          liveRef.current.onDateChange(task.id, toDateInput(start), toDateInput(end))
        },
        on_progress_change: (task, progress) => {
          liveRef.current.onProgressChange(task.id, Math.round(progress))
        },
        popup: (ctx) => {
          const { flagOptions: liveOptions, taskFlagsByTaskId: liveMap } = liveRef.current
          ctx.set_title(escapeHtml(ctx.task.name))
          ctx.set_subtitle('')
          const optionIds = liveMap.get(ctx.task.id) ?? []
          const pills = optionIds
            .map((id) => liveOptions.find((o) => o.id === id))
            .filter((o): o is FlagOptionRow => !!o)
            .map(
              (o) =>
                `<span style="display:inline-block;background:${escapeHtml(o.color)};color:${contrastTextColor(
                  o.color,
                )};border-radius:9999px;padding:1px 8px;font-size:11px;margin:2px 4px 2px 0;">${escapeHtml(
                  o.label,
                )}</span>`,
            )
            .join('')
          ctx.set_details(
            `Progress: ${Math.round(ctx.task.progress)}%${pills ? `<div style="margin-top:6px">${pills}</div>` : ''}`,
          )
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
      {flags.length > 0 && (
        <div className="mb-2 flex items-center gap-2">
          <select
            multiple
            value={flagFilter}
            onChange={(e) => setFlagFilter(Array.from(e.target.selectedOptions, (o) => o.value))}
            size={1}
            className="h-[34px] w-40 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:h-auto focus:outline-none focus:ring-2 focus:ring-indigo-500"
            title="Ctrl/Cmd-click to select multiple flag values"
          >
            {flags.map((flag) => (
              <optgroup key={flag.id} label={flag.name}>
                {flagOptions
                  .filter((o) => o.flag_id === flag.id && !o.archived)
                  .map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
          {flagFilter.length > 0 && (
            <button
              type="button"
              onClick={() => setFlagFilter([])}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Clear filter
            </button>
          )}
        </div>
      )}

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
