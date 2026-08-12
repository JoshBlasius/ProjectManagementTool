import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTasks, type NewTaskInput } from '../hooks/useTasks'
import { useDependencies } from '../hooks/useDependencies'
import { buildTaskTree, type TaskNode } from '../types/domain'
import { AppHeader } from '../components/AppHeader'
import { TaskRow } from '../components/TaskRow'
import { TaskFormModal } from '../components/TaskFormModal'
import { TaskTable } from '../components/TaskTable'
import { GanttChart } from '../components/GanttChart'

type FormState = { mode: 'create'; parentTaskId: string | null } | { mode: 'edit'; task: TaskNode }
type ViewMode = 'tree' | 'table' | 'gantt'

const VIEW_TABS: { id: ViewMode; label: string }[] = [
  { id: 'tree', label: 'Tree' },
  { id: 'table', label: 'Table' },
  { id: 'gantt', label: 'Gantt' },
]

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { tasks, loading, error, createTask, updateTask, deleteTask } = useTasks(projectId!)
  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks])
  const { dependencies, addDependency, removeDependency } = useDependencies(taskIds)
  const [formState, setFormState] = useState<FormState | null>(null)
  const [pendingDelete, setPendingDelete] = useState<TaskNode | null>(null)
  const [view, setView] = useState<ViewMode>('tree')

  const tree = useMemo(() => buildTaskTree(tasks), [tasks])

  async function handleSubmit(input: NewTaskInput) {
    if (formState?.mode === 'edit') {
      return updateTask(formState.task.id, input)
    }
    const result = await createTask(input)
    return { error: result.error }
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return
    await deleteTask(pendingDelete.id)
    setPendingDelete(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Link to="/projects" className="text-sm text-indigo-600 hover:text-indigo-500">
          ← All projects
        </Link>

        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Tasks</h1>
          <button
            onClick={() => setFormState({ mode: 'create', parentTaskId: null })}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            New task
          </button>
        </div>

        <div className="mt-4 flex gap-1 border-b border-gray-200">
          {VIEW_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
                view === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading && <p className="mt-6 text-sm text-gray-500">Loading tasks…</p>}
        {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

        {!loading && !error && (
          <div className="mt-4">
            {view === 'tree' &&
              (tree.length === 0 ? (
                <p className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500">
                  No tasks yet. Create the first one above.
                </p>
              ) : (
                <div className="rounded-lg border border-gray-200 bg-white">
                  {tree.map((node) => (
                    <TaskRow
                      key={node.id}
                      node={node}
                      depth={0}
                      onAddSubtask={(parentId) => setFormState({ mode: 'create', parentTaskId: parentId })}
                      onEdit={(task) => setFormState({ mode: 'edit', task })}
                      onDelete={(task) => setPendingDelete(task)}
                    />
                  ))}
                </div>
              ))}

            {view === 'table' && <TaskTable tasks={tasks} onUpdate={updateTask} />}

            {view === 'gantt' && (
              <GanttChart
                tasks={tasks}
                dependencies={dependencies}
                onDateChange={(taskId, start_date, end_date) => updateTask(taskId, { start_date, end_date })}
                onProgressChange={(taskId, percent_complete) => updateTask(taskId, { percent_complete })}
              />
            )}
          </div>
        )}
      </main>

      {formState && (
        <TaskFormModal
          title={formState.mode === 'edit' ? 'Edit task' : formState.parentTaskId ? 'New subtask' : 'New task'}
          parentTaskId={formState.mode === 'create' ? formState.parentTaskId : null}
          initial={formState.mode === 'edit' ? formState.task : undefined}
          onClose={() => setFormState(null)}
          onSubmit={handleSubmit}
          dependencyProps={
            formState.mode === 'edit'
              ? {
                  allTasks: tasks,
                  dependencies,
                  onAddDependency: (dependsOnTaskId, type) => addDependency(formState.task.id, dependsOnTaskId, type),
                  onRemoveDependency: removeDependency,
                }
              : undefined
          }
        />
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl">
            <h2 className="text-base font-semibold text-gray-900">Delete task?</h2>
            <p className="mt-2 text-sm text-gray-500">
              "{pendingDelete.name}"{pendingDelete.children.length > 0 && ' and all of its subtasks'} will be
              permanently deleted.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setPendingDelete(null)}
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
