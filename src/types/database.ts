// Hand-written types matching supabase/migrations/0001_init.sql.
// Once the project is linked to a real Supabase project, these can be
// regenerated with `supabase gen types typescript` and this file replaced.

export type GlobalRole = 'admin' | 'member'
export type ProjectRole = 'editor' | 'viewer'
export type TaskStatus = 'not_started' | 'in_progress' | 'blocked' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type DependencyType =
  | 'finish_to_start'
  | 'start_to_start'
  | 'finish_to_finish'
  | 'start_to_finish'

export interface UserRow {
  id: string
  name: string
  email: string
  role: GlobalRole
  created_at: string
}

export interface ProjectRow {
  id: string
  name: string
  description: string | null
  created_by: string | null
  created_at: string
}

export interface ProjectPermissionRow {
  id: string
  project_id: string
  user_id: string
  role: ProjectRole
  created_at: string
}

export interface TaskRow {
  id: string
  project_id: string
  parent_task_id: string | null
  name: string
  description: string | null
  status: TaskStatus
  owner_id: string | null
  start_date: string | null
  end_date: string | null
  priority: TaskPriority
  percent_complete: number
  created_at: string
  updated_at: string
}

export interface DependencyRow {
  id: string
  task_id: string
  depends_on_task_id: string
  type: DependencyType
  created_at: string
}

export interface FlagRow {
  id: string
  project_id: string | null
  name: string
  color: string
  created_by: string | null
  created_at: string
}

export interface FlagOptionRow {
  id: string
  flag_id: string
  label: string
  color: string
  sort_order: number
  archived: boolean
  created_at: string
}

export interface TaskFlagRow {
  task_id: string
  flag_option_id: string
  created_at: string
}

type TableDef<Row, Insert, Update> = {
  Row: Row
  Insert: Insert
  Update: Update
}

export interface Database {
  public: {
    Tables: {
      users: TableDef<
        UserRow,
        Omit<UserRow, 'created_at'> & { created_at?: string },
        Partial<Omit<UserRow, 'id'>>
      >
      projects: TableDef<
        ProjectRow,
        Omit<ProjectRow, 'id' | 'created_at'> & { id?: string; created_at?: string },
        Partial<Omit<ProjectRow, 'id'>>
      >
      project_permissions: TableDef<
        ProjectPermissionRow,
        Omit<ProjectPermissionRow, 'id' | 'created_at'> & { id?: string; created_at?: string },
        Partial<Omit<ProjectPermissionRow, 'id'>>
      >
      tasks: TableDef<
        TaskRow,
        Omit<TaskRow, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        },
        Partial<Omit<TaskRow, 'id'>>
      >
      dependencies: TableDef<
        DependencyRow,
        Omit<DependencyRow, 'id' | 'created_at'> & { id?: string; created_at?: string },
        Partial<Omit<DependencyRow, 'id'>>
      >
      flags: TableDef<
        FlagRow,
        Omit<FlagRow, 'id' | 'created_at'> & { id?: string; created_at?: string },
        Partial<Omit<FlagRow, 'id'>>
      >
      flag_options: TableDef<
        FlagOptionRow,
        Omit<FlagOptionRow, 'id' | 'created_at'> & { id?: string; created_at?: string },
        Partial<Omit<FlagOptionRow, 'id'>>
      >
      task_flags: TableDef<
        TaskFlagRow,
        Omit<TaskFlagRow, 'created_at'> & { created_at?: string },
        Partial<TaskFlagRow>
      >
    }
  }
}
