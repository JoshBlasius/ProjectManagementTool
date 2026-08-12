import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { TaskRow } from '../types/database'

export type NewTaskInput = Omit<
  TaskRow,
  'id' | 'created_at' | 'updated_at' | 'project_id'
>

export function useTasks(projectId: string) {
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
    if (error) setError(error.message)
    else setTasks(data)
    setLoading(false)
  }, [projectId])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function createTask(input: NewTaskInput) {
    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...input, project_id: projectId })
      .select('*')
      .single()
    if (error) return { error: error.message, task: null }
    setTasks((prev) => [...prev, data])
    return { error: null, task: data }
  }

  async function updateTask(id: string, patch: Partial<NewTaskInput>) {
    const { data, error } = await supabase
      .from('tasks')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single()
    if (error) return { error: error.message }
    setTasks((prev) => prev.map((t) => (t.id === id ? data : t)))
    return { error: null }
  }

  async function deleteTask(id: string) {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) return { error: error.message }
    // Subtasks cascade-delete in the DB (on delete cascade); prune the whole
    // subtree from local state so the UI matches without a round trip.
    setTasks((prev) => {
      const toRemove = new Set([id])
      let changed = true
      while (changed) {
        changed = false
        for (const t of prev) {
          if (t.parent_task_id && toRemove.has(t.parent_task_id) && !toRemove.has(t.id)) {
            toRemove.add(t.id)
            changed = true
          }
        }
      }
      return prev.filter((t) => !toRemove.has(t.id))
    })
    return { error: null }
  }

  return { tasks, loading, error, refresh, createTask, updateTask, deleteTask }
}
