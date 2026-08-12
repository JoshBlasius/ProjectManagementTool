import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { TaskFlagRow } from '../types/database'

export function useTaskFlags(taskIds: string[]) {
  const [taskFlags, setTaskFlags] = useState<TaskFlagRow[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (taskIds.length === 0) {
      setTaskFlags([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase.from('task_flags').select('*').in('task_id', taskIds)
    if (!error) setTaskFlags(data)
    setLoading(false)
  }, [taskIds])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function addTaskFlag(taskId: string, flagOptionId: string) {
    const { data, error } = await supabase
      .from('task_flags')
      .insert({ task_id: taskId, flag_option_id: flagOptionId })
      .select('*')
      .single()
    if (error) return { error: error.message }
    setTaskFlags((prev) => [...prev, data])
    return { error: null }
  }

  async function removeTaskFlag(taskId: string, flagOptionId: string) {
    const { error } = await supabase
      .from('task_flags')
      .delete()
      .eq('task_id', taskId)
      .eq('flag_option_id', flagOptionId)
    if (error) return { error: error.message }
    setTaskFlags((prev) => prev.filter((tf) => !(tf.task_id === taskId && tf.flag_option_id === flagOptionId)))
    return { error: null }
  }

  return { taskFlags, loading, refresh, addTaskFlag, removeTaskFlag }
}
