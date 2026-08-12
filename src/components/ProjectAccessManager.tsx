import { useState, type FormEvent } from 'react'
import { Modal } from './Modal'
import type { ProjectMember } from '../hooks/useProjectMembers'
import type { ProjectRole, UserRow } from '../types/database'

const ROLE_OPTIONS: ProjectRole[] = ['editor', 'viewer']

interface ProjectAccessManagerProps {
  members: ProjectMember[]
  allUsers: UserRow[]
  onClose: () => void
  onAdd: (userId: string, role: ProjectRole) => Promise<{ error: string | null }>
  onUpdateRole: (id: string, role: ProjectRole) => Promise<{ error: string | null }>
  onRemove: (id: string) => Promise<{ error: string | null }>
}

export function ProjectAccessManager({
  members,
  allUsers,
  onClose,
  onAdd,
  onUpdateRole,
  onRemove,
}: ProjectAccessManagerProps) {
  const [userId, setUserId] = useState('')
  const [role, setRole] = useState<ProjectRole>('viewer')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const memberUserIds = new Set(members.map((m) => m.user_id))
  const candidateUsers = allUsers.filter((u) => !memberUserIds.has(u.id))

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!userId) return
    setSubmitting(true)
    setError(null)
    const result = await onAdd(userId, role)
    setSubmitting(false)
    if (result.error) setError(result.error)
    else setUserId('')
  }

  return (
    <Modal title="Manage access" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Members</p>
          {members.length === 0 ? (
            <p className="mt-1 text-sm text-gray-400">No one has explicit access yet.</p>
          ) : (
            <ul className="mt-1 space-y-1">
              {members.map((m) => (
                <li key={m.id} className="flex items-center gap-2 rounded-md bg-gray-50 px-2 py-1.5">
                  <span className="flex-1 truncate text-sm text-gray-900">
                    {m.user?.name ?? 'Unknown user'}{' '}
                    <span className="text-gray-400">{m.user?.email}</span>
                  </span>
                  <select
                    value={m.role}
                    onChange={(e) => onUpdateRole(m.id, e.target.value as ProjectRole)}
                    className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r === 'editor' ? 'Editor' : 'Viewer'}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => onRemove(m.id)}
                    className="text-xs text-red-600 hover:text-red-500"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form onSubmit={handleAdd} className="flex items-end gap-2 rounded-md border border-gray-200 p-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700" htmlFor="member-user">
              Add someone
            </label>
            <select
              id="member-user"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a person…</option>
              {candidateUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700" htmlFor="member-role">
              Role
            </label>
            <select
              id="member-role"
              value={role}
              onChange={(e) => setRole(e.target.value as ProjectRole)}
              className="mt-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r === 'editor' ? 'Editor' : 'Viewer'}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={!userId || submitting}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            Add
          </button>
        </form>
        <p className="text-xs text-gray-400">
          Only people who already have an account show up here — ask new teammates to sign up first, then add them.
        </p>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  )
}
