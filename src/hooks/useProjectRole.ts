import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { ProjectRole } from '../types/database'

export type EffectiveRole = 'admin' | ProjectRole | null

export function useProjectRole(projectId: string) {
  const { profile, session } = useAuth()
  const [role, setRole] = useState<EffectiveRole>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) {
      setRole(null)
      setLoading(false)
      return
    }
    if (profile?.role === 'admin') {
      setRole('admin')
      setLoading(false)
      return
    }
    setLoading(true)
    supabase
      .from('project_permissions')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        setRole(data?.role ?? null)
        setLoading(false)
      })
  }, [projectId, session, profile])

  return {
    role,
    isEditor: role === 'admin' || role === 'editor',
    isViewer: role === 'viewer',
    hasAccess: role !== null,
    loading,
  }
}
