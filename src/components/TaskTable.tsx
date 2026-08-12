import { useCallback, useMemo, useState } from 'react'
import type { NewTaskInput } from '../hooks/useTasks'
import { priorityLabel, statusLabel } from '../lib/taskLabels'
import { useUsers } from '../hooks/useUsers'
import { FlagPills } from './FlagPills'
import type { FlagOptionRow, FlagRow, TaskPriority, TaskRow, TaskStatus } from '../types/database'

type SortKey = 'name' | 'status' | 'priority' | 'owner' | 'start_date' | 'end_date' | 'percent_complete'
type SortDir = 'asc' | 'desc'

const STATUS_OPTIONS: TaskStatus[] = ['not_started', 'in_progress', 'blocked', 'done']
const PRIORITY_OPTIONS: TaskPriority[] = ['low', 'medium', 'high', 'urgent']

interface TaskTableProps {
  tasks: TaskRow[]
  onUpdate: (id: string, patch: Partial<NewTaskInput>) => Promise<{ error: string | null }>
  flags: FlagRow[]
  flagOptions: FlagOptionRow[]
  taskFlagsByTaskId: Map<string, string[]>
  isEditor: boolean
}

function EditableText({
  value,
  onCommit,
  disabled,
}: {
  value: string
  onCommit: (v: string) => void
  disabled: boolean
}) {
  const [draft, setDraft] = useState(value)
  return (
    <input
      value={draft}
      disabled={disabled}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft !== value && draft.trim()) onCommit(draft)
        else setDraft(value)
      }}
      className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-sm hover:border-gray-200 focus:border-indigo-400 focus:bg-white focus:outline-none disabled:cursor-default disabled:hover:border-transparent"
    />
  )
}

export function TaskTable({ tasks, onUpdate, flags, flagOptions, taskFlagsByTaskId, isEditor }: TaskTableProps) {
  const { users } = useUsers()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('')
  const [ownerFilter, setOwnerFilter] = useState<string>('')
  const [flagFilter, setFlagFilter] = useState<string[]>([])
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const ownerName = useCallback(
    (id: string | null) => users.find((u) => u.id === id)?.name ?? 'Unassigned',
    [users],
  )

  const rows = useMemo(() => {
    let result = tasks
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((t) => t.name.toLowerCase().includes(q))
    }
    if (statusFilter) result = result.filter((t) => t.status === statusFilter)
    if (priorityFilter) result = result.filter((t) => t.priority === priorityFilter)
    if (ownerFilter) result = result.filter((t) => (t.owner_id ?? '') === ownerFilter)
    if (flagFilter.length > 0) {
      result = result.filter((t) => (taskFlagsByTaskId.get(t.id) ?? []).some((id) => flagFilter.includes(id)))
    }

    if (sortKey) {
      result = [...result].sort((a, b) => {
        let av: string | number
        let bv: string | number
        switch (sortKey) {
          case 'owner':
            av = ownerName(a.owner_id)
            bv = ownerName(b.owner_id)
            break
          case 'start_date':
          case 'end_date':
            av = a[sortKey] ?? ''
            bv = b[sortKey] ?? ''
            break
          default:
            av = a[sortKey]
            bv = b[sortKey]
        }
        const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv))
        return sortDir === 'asc' ? cmp : -cmp
      })
    }
    return result
  }, [tasks, search, statusFilter, priorityFilter, ownerFilter, flagFilter, sortKey, sortDir, ownerName, taskFlagsByTaskId])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function SortHeader({ label, sortableKey }: { label: string; sortableKey: SortKey }) {
    return (
      <button
        type="button"
        onClick={() => toggleSort(sortableKey)}
        className="flex items-center gap-1 text-left text-xs font-medium uppercase tracking-wide text-gray-500 hover:text-gray-700"
      >
        {label}
        {sortKey === sortableKey && <span>{sortDir === 'asc' ? '▲' : '▼'}</span>}
      </button>
    )
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TaskStatus | '')}
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | '')}
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All priorities</option>
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {priorityLabel(p)}
            </option>
          ))}
        </select>
        <select
          value={ownerFilter}
          onChange={(e) => setOwnerFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All owners</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        {flags.length > 0 && (
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
        )}
        {(search || statusFilter || priorityFilter || ownerFilter || flagFilter.length > 0) && (
          <button
            type="button"
            onClick={() => {
              setSearch('')
              setStatusFilter('')
              setPriorityFilter('')
              setOwnerFilter('')
              setFlagFilter([])
            }}
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2">
                <SortHeader label="Name" sortableKey="name" />
              </th>
              <th className="px-3 py-2">
                <SortHeader label="Status" sortableKey="status" />
              </th>
              <th className="px-3 py-2">
                <SortHeader label="Priority" sortableKey="priority" />
              </th>
              <th className="px-3 py-2">
                <SortHeader label="Owner" sortableKey="owner" />
              </th>
              <th className="px-3 py-2">
                <SortHeader label="Start" sortableKey="start_date" />
              </th>
              <th className="px-3 py-2">
                <SortHeader label="End" sortableKey="end_date" />
              </th>
              <th className="px-3 py-2">
                <SortHeader label="% Complete" sortableKey="percent_complete" />
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Flags
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((task) => (
              <tr key={task.id} className="hover:bg-gray-50">
                <td className="w-64 px-3 py-1.5">
                  <EditableText
                    value={task.name}
                    disabled={!isEditor}
                    onCommit={(name) => onUpdate(task.id, { name })}
                  />
                </td>
                <td className="px-3 py-1.5">
                  <select
                    value={task.status}
                    disabled={!isEditor}
                    onChange={(e) => onUpdate(task.id, { status: e.target.value as TaskStatus })}
                    className="rounded border border-transparent bg-transparent px-1 py-0.5 text-sm hover:border-gray-200 focus:border-indigo-400 focus:outline-none disabled:hover:border-transparent"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {statusLabel(s)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-1.5">
                  <select
                    value={task.priority}
                    disabled={!isEditor}
                    onChange={(e) => onUpdate(task.id, { priority: e.target.value as TaskPriority })}
                    className="rounded border border-transparent bg-transparent px-1 py-0.5 text-sm hover:border-gray-200 focus:border-indigo-400 focus:outline-none disabled:hover:border-transparent"
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {priorityLabel(p)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-1.5">
                  <select
                    value={task.owner_id ?? ''}
                    disabled={!isEditor}
                    onChange={(e) => onUpdate(task.id, { owner_id: e.target.value || null })}
                    className="rounded border border-transparent bg-transparent px-1 py-0.5 text-sm hover:border-gray-200 focus:border-indigo-400 focus:outline-none disabled:hover:border-transparent"
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="date"
                    value={task.start_date ?? ''}
                    disabled={!isEditor}
                    onChange={(e) => onUpdate(task.id, { start_date: e.target.value || null })}
                    className="rounded border border-transparent bg-transparent px-1 py-0.5 text-sm hover:border-gray-200 focus:border-indigo-400 focus:outline-none disabled:hover:border-transparent"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="date"
                    value={task.end_date ?? ''}
                    disabled={!isEditor}
                    onChange={(e) => onUpdate(task.id, { end_date: e.target.value || null })}
                    className="rounded border border-transparent bg-transparent px-1 py-0.5 text-sm hover:border-gray-200 focus:border-indigo-400 focus:outline-none disabled:hover:border-transparent"
                  />
                </td>
                <td className="w-24 px-3 py-1.5">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={task.percent_complete}
                    disabled={!isEditor}
                    onChange={(e) => onUpdate(task.id, { percent_complete: Number(e.target.value) })}
                    className="w-16 rounded border border-transparent bg-transparent px-1 py-0.5 text-sm hover:border-gray-200 focus:border-indigo-400 focus:outline-none disabled:hover:border-transparent"
                  />
                </td>
                <td className="w-40 px-3 py-1.5">
                  <FlagPills optionIds={taskFlagsByTaskId.get(task.id) ?? []} options={flagOptions} size="xs" />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-sm text-gray-500">
                  No tasks match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
