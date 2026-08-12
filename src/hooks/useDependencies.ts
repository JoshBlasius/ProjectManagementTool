import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { DependencyRow, DependencyType } from '../types/database'

export function useDependencies(taskIds: string[]) {
  const [dependencies, setDependencies] = useState<DependencyRow[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (taskIds.length === 0) {
      setDependencies([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('dependencies')
      .select('*')
      .in('task_id', taskIds)
    if (!error) setDependencies(data)
    setLoading(false)
  }, [taskIds])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function addDependency(taskId: string, dependsOnTaskId: string, type: DependencyType = 'finish_to_start') {
    const { data, error } = await supabase
      .from('dependencies')
      .insert({ task_id: taskId, depends_on_task_id: dependsOnTaskId, type })
      .select('*')
      .single()
    if (error) return { error: error.message }
    setDependencies((prev) => [...prev, data])
    return { error: null }
  }

  async function removeDependency(id: string) {
    const { error } = await supabase.from('dependencies').delete().eq('id', id)
    if (error) return { error: error.message }
    setDependencies((prev) => prev.filter((d) => d.id !== id))
    return { error: null }
  }

  return { dependencies, loading, refresh, addDependency, removeDependency }
}
