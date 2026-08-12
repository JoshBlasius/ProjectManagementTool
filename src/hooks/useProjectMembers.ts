import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ProjectPermissionRow, ProjectRole, UserRow } from '../types/database'

export interface ProjectMember extends ProjectPermissionRow {
  user: UserRow | null
}

export function useProjectMembers(projectId: string) {
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [allUsers, setAllUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const [{ data: permissionRows }, { data: userRows }] = await Promise.all([
      supabase.from('project_permissions').select('*').eq('project_id', projectId),
      supabase.from('users').select('*').order('name', { ascending: true }),
    ])
    const usersById = new Map((userRows ?? []).map((u) => [u.id, u]))
    setMembers((permissionRows ?? []).map((p) => ({ ...p, user: usersById.get(p.user_id) ?? null })))
    setAllUsers(userRows ?? [])
    setLoading(false)
  }, [projectId])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function addMember(userId: string, role: ProjectRole) {
    const { data, error } = await supabase
      .from('project_permissions')
      .insert({ project_id: projectId, user_id: userId, role })
      .select('*')
      .single()
    if (error) return { error: error.message }
    const user = allUsers.find((u) => u.id === userId) ?? null
    setMembers((prev) => [...prev, { ...data, user }])
    return { error: null }
  }

  async function updateMemberRole(id: string, role: ProjectRole) {
    const { data, error } = await supabase
      .from('project_permissions')
      .update({ role })
      .eq('id', id)
      .select('*')
      .single()
    if (error) return { error: error.message }
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role: data.role } : m)))
    return { error: null }
  }

  async function removeMember(id: string) {
    const { error } = await supabase.from('project_permissions').delete().eq('id', id)
    if (error) return { error: error.message }
    setMembers((prev) => prev.filter((m) => m.id !== id))
    return { error: null }
  }

  return { members, allUsers, loading, refresh, addMember, updateMemberRole, removeMember }
}
