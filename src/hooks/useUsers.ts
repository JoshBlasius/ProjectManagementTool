import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { UserRow } from '../types/database'

export function useUsers() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('users')
      .select('*')
      .order('name', { ascending: true })
      .then(({ data }) => {
        setUsers(data ?? [])
        setLoading(false)
      })
  }, [])

  return { users, loading }
}
