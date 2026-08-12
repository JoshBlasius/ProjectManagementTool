import { useState } from 'react'
import { dependencyTypeLabel } from '../lib/taskLabels'
import type { DependencyRow, DependencyType, TaskRow } from '../types/database'

const TYPE_OPTIONS: DependencyType[] = ['finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish']

interface DependencyEditorProps {
  task: TaskRow
  allTasks: TaskRow[]
  dependencies: DependencyRow[]
  onAdd: (dependsOnTaskId: string, type: DependencyType) => Promise<{ error: string | null }>
  onRemove: (id: string) => Promise<{ error: string | null }>
}

export function DependencyEditor({ task, allTasks, dependencies, onAdd, onRemove }: DependencyEditorProps) {
  const [selectedTaskId, setSelectedTaskId] = useState('')
  const [selectedType, setSelectedType] = useState<DependencyType>('finish_to_start')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const taskName = (id: string) => allTasks.find((t) => t.id === id)?.name ?? '(unknown task)'

  const predecessors = dependencies.filter((d) => d.task_id === task.id)
  const successors = dependencies.filter((d) => d.depends_on_task_id === task.id)

  const linkedPredecessorIds = new Set(predecessors.map((d) => d.depends_on_task_id))
  const candidateTasks = allTasks.filter((t) => t.id !== task.id && !linkedPredecessorIds.has(t.id))

  async function handleAdd() {
    if (!selectedTaskId) return
    setSubmitting(true)
    setError(null)
    const result = await onAdd(selectedTaskId, selectedType)
    setSubmitting(false)
    if (result.error) setError(result.error)
    else setSelectedTaskId('')
  }

  return (
    <div className="space-y-4 rounded-md border border-gray-200 p-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Depends on</p>
        {predecessors.length === 0 ? (
          <p className="mt-1 text-sm text-gray-400">No predecessors.</p>
        ) : (
          <ul className="mt-1 space-y-1">
            {predecessors.map((dep) => (
              <li
                key={dep.id}
                className="flex items-center justify-between rounded-md bg-gray-50 px-2 py-1 text-sm text-gray-700"
              >
                <span>
                  {taskName(dep.depends_on_task_id)}{' '}
                  <span className="text-gray-400">({dependencyTypeLabel(dep.type)})</span>
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(dep.id)}
                  className="text-xs text-red-600 hover:text-red-500"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Blocks</p>
        {successors.length === 0 ? (
          <p className="mt-1 text-sm text-gray-400">No dependent tasks.</p>
        ) : (
          <ul className="mt-1 space-y-1">
            {successors.map((dep) => (
              <li
                key={dep.id}
                className="flex items-center justify-between rounded-md bg-gray-50 px-2 py-1 text-sm text-gray-700"
              >
                <span>
                  {taskName(dep.task_id)}{' '}
                  <span className="text-gray-400">({dependencyTypeLabel(dep.type)})</span>
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(dep.id)}
                  className="text-xs text-red-600 hover:text-red-500"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {candidateTasks.length > 0 && (
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700" htmlFor="dep-task">
              Add predecessor
            </label>
            <select
              id="dep-task"
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a task…</option>
              {candidateTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700" htmlFor="dep-type">
              Type
            </label>
            <select
              id="dep-type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as DependencyType)}
              className="mt-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {dependencyTypeLabel(t)}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!selectedTaskId || submitting}
            className="rounded-md bg-gray-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
