import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ProjectRow } from '../types/database'

export function useProjects() {
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setProjects(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function createProject(name: string, description: string, createdBy: string) {
    const { data, error } = await supabase
      .from('projects')
      .insert({ name, description: description || null, created_by: createdBy })
      .select('*')
      .single()
    if (error) return { error: error.message, project: null }
    setProjects((prev) => [data, ...prev])
    return { error: null, project: data }
  }

  return { projects, loading, error, refresh, createProject }
}
