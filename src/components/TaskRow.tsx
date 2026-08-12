import { useState } from 'react'
import type { TaskNode } from '../types/domain'
import { priorityLabel, statusLabel } from '../lib/taskLabels'
import { FlagPills } from './FlagPills'
import type { FlagOptionRow, TaskStatus } from '../types/database'
import { useUsers } from '../hooks/useUsers'

const STATUS_STYLES: Record<TaskStatus, string> = {
  not_started: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-700',
  blocked: 'bg-red-100 text-red-700',
  done: 'bg-green-100 text-green-700',
}

interface TaskRowProps {
  node: TaskNode
  depth: number
  flagOptions: FlagOptionRow[]
  taskFlagsByTaskId: Map<string, string[]>
  isEditor: boolean
  onAddSubtask: (parentId: string) => void
  onEdit: (task: TaskNode) => void
  onDelete: (task: TaskNode) => void
}

export function TaskRow({
  node,
  depth,
  flagOptions,
  taskFlagsByTaskId,
  isEditor,
  onAddSubtask,
  onEdit,
  onDelete,
}: TaskRowProps) {
  const [expanded, setExpanded] = useState(true)
  const { users } = useUsers()
  const owner = users.find((u) => u.id === node.owner_id)
  const hasChildren = node.children.length > 0
  const flagOptionIds = taskFlagsByTaskId.get(node.id) ?? []

  return (
    <div>
      <div
        className="group flex items-center gap-2 border-b border-gray-100 py-2 pr-2 hover:bg-gray-50"
        style={{ paddingLeft: `${depth * 24 + 8}px` }}
      >
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className={`w-4 shrink-0 text-gray-400 ${hasChildren ? '' : 'invisible'}`}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? '▾' : '▸'}
        </button>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm text-gray-900">{node.name}</span>
          {flagOptionIds.length > 0 && (
            <span className="mt-0.5 block">
              <FlagPills optionIds={flagOptionIds} options={flagOptions} size="xs" />
            </span>
          )}
        </span>

        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[node.status]}`}>
          {statusLabel(node.status)}
        </span>

        <span className="w-20 shrink-0 text-xs text-gray-500">{priorityLabel(node.priority)}</span>

        <span className="w-28 shrink-0 truncate text-xs text-gray-500">{owner?.name ?? 'Unassigned'}</span>

        <span className="w-40 shrink-0 text-xs text-gray-500">
          {node.start_date ?? '—'} → {node.end_date ?? '—'}
        </span>

        <span className="w-12 shrink-0 text-right text-xs text-gray-500">{node.percent_complete}%</span>

        {isEditor && (
          <div className="flex shrink-0 gap-2 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => onAddSubtask(node.id)}
              className="text-xs text-indigo-600 hover:text-indigo-500"
            >
              + Subtask
            </button>
            <button type="button" onClick={() => onEdit(node)} className="text-xs text-gray-600 hover:text-gray-900">
              Edit
            </button>
            <button type="button" onClick={() => onDelete(node)} className="text-xs text-red-600 hover:text-red-500">
              Delete
            </button>
          </div>
        )}
      </div>

      {expanded &&
        node.children.map((child) => (
          <TaskRow
            key={child.id}
            node={child}
            depth={depth + 1}
            flagOptions={flagOptions}
            taskFlagsByTaskId={taskFlagsByTaskId}
            isEditor={isEditor}
            onAddSubtask={onAddSubtask}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
    </div>
  )
}
