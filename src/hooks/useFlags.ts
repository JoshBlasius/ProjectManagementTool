import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { FlagOptionRow, FlagRow } from '../types/database'

export function useFlags(projectId: string) {
  const [flags, setFlags] = useState<FlagRow[]>([])
  const [options, setOptions] = useState<FlagOptionRow[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const [{ data: globalFlags }, { data: projectFlags }] = await Promise.all([
      supabase.from('flags').select('*').is('project_id', null),
      supabase.from('flags').select('*').eq('project_id', projectId),
    ])
    const flagData = [...(globalFlags ?? []), ...(projectFlags ?? [])]
    setFlags(flagData)

    const flagIds = flagData.map((f) => f.id)
    if (flagIds.length === 0) {
      setOptions([])
      setLoading(false)
      return
    }
    const { data: optionData } = await supabase
      .from('flag_options')
      .select('*')
      .in('flag_id', flagIds)
      .order('sort_order', { ascending: true })
    setOptions(optionData ?? [])
    setLoading(false)
  }, [projectId])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function createFlag(name: string, color: string, projectScoped: boolean, createdBy: string) {
    const { data, error } = await supabase
      .from('flags')
      .insert({ name, color, project_id: projectScoped ? projectId : null, created_by: createdBy })
      .select('*')
      .single()
    if (error) return { error: error.message, flag: null }
    setFlags((prev) => [...prev, data])
    return { error: null, flag: data }
  }

  async function createOption(flagId: string, label: string, color: string) {
    const sortOrder = options.filter((o) => o.flag_id === flagId).length
    const { data, error } = await supabase
      .from('flag_options')
      .insert({ flag_id: flagId, label, color, sort_order: sortOrder, archived: false })
      .select('*')
      .single()
    if (error) return { error: error.message }
    setOptions((prev) => [...prev, data])
    return { error: null }
  }

  async function updateOption(
    id: string,
    patch: Partial<Pick<FlagOptionRow, 'label' | 'color' | 'archived' | 'sort_order'>>,
  ) {
    const { data, error } = await supabase.from('flag_options').update(patch).eq('id', id).select('*').single()
    if (error) return { error: error.message }
    setOptions((prev) => prev.map((o) => (o.id === id ? data : o)))
    return { error: null }
  }

  async function reorderOption(id: string, direction: 'up' | 'down') {
    const option = options.find((o) => o.id === id)
    if (!option) return
    const siblings = options
      .filter((o) => o.flag_id === option.flag_id && !o.archived)
      .sort((a, b) => a.sort_order - b.sort_order)
    const idx = siblings.findIndex((o) => o.id === id)
    const swapWith = direction === 'up' ? siblings[idx - 1] : siblings[idx + 1]
    if (!swapWith) return
    await Promise.all([
      updateOption(option.id, { sort_order: swapWith.sort_order }),
      updateOption(swapWith.id, { sort_order: option.sort_order }),
    ])
  }

  return { flags, options, loading, refresh, createFlag, createOption, updateOption, reorderOption }
}
