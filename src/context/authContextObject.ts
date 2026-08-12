import { createContext } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { UserRow } from '../types/database'

export interface AuthContextValue {
  session: Session | null
  profile: UserRow | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
