import { useState, type FormEvent } from 'react'
import { Modal } from './Modal'
import type { FlagOptionRow, FlagRow } from '../types/database'

interface FlagManagerProps {
  flags: FlagRow[]
  options: FlagOptionRow[]
  onClose: () => void
  onCreateFlag: (name: string, color: string, projectScoped: boolean) => Promise<{ error: string | null }>
  onCreateOption: (flagId: string, label: string, color: string) => Promise<{ error: string | null }>
  onUpdateOption: (
    id: string,
    patch: Partial<Pick<FlagOptionRow, 'label' | 'color' | 'archived'>>,
  ) => Promise<{ error: string | null }>
  onReorderOption: (id: string, direction: 'up' | 'down') => void
}

function NewFlagForm({
  onCreate,
}: {
  onCreate: (name: string, color: string, projectScoped: boolean) => Promise<{ error: string | null }>
}) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#6366f1')
  const [projectScoped, setProjectScoped] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    const result = await onCreate(name.trim(), color, projectScoped)
    setSubmitting(false)
    if (result.error) setError(result.error)
    else {
      setName('')
      setColor('#6366f1')
      setProjectScoped(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2 rounded-md border border-gray-200 p-3">
      <div className="flex-1">
        <label className="block text-xs font-medium text-gray-700" htmlFor="new-flag-name">
          New flag name
        </label>
        <input
          id="new-flag-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Risk, Team, Client"
          className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700" htmlFor="new-flag-color">
          Color
        </label>
        <input
          id="new-flag-color"
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="mt-1 h-8 w-12 rounded border border-gray-300"
        />
      </div>
      <label className="flex items-center gap-1.5 pb-2 text-sm text-gray-700">
        <input type="checkbox" checked={projectScoped} onChange={(e) => setProjectScoped(e.target.checked)} />
        This project only
      </label>
      <button
        type="submit"
        disabled={submitting || !name.trim()}
        className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        Create flag
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  )
}

function NewOptionForm({
  onCreate,
}: {
  onCreate: (label: string, color: string) => Promise<{ error: string | null }>
}) {
  const [label, setLabel] = useState('')
  const [color, setColor] = useState('#6b7280')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!label.trim()) return
    const result = await onCreate(label.trim(), color)
    if (result.error) setError(result.error)
    else {
      setLabel('')
      setColor('#6b7280')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="New option label"
        className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        className="h-7 w-10 rounded border border-gray-300"
      />
      <button
        type="submit"
        disabled={!label.trim()}
        className="rounded-md bg-gray-800 px-2.5 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        Add
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  )
}

export function FlagManager({
  flags,
  options,
  onClose,
  onCreateFlag,
  onCreateOption,
  onUpdateOption,
  onReorderOption,
}: FlagManagerProps) {
  return (
    <Modal title="Manage flags" onClose={onClose}>
      <div className="space-y-5">
        <NewFlagForm onCreate={onCreateFlag} />

        {flags.length === 0 && <p className="text-sm text-gray-500">No flags yet — create one above.</p>}

        {flags.map((flag) => {
          const flagOptions = options
            .filter((o) => o.flag_id === flag.id)
            .sort((a, b) => a.sort_order - b.sort_order)
          const active = flagOptions.filter((o) => !o.archived)
          const archived = flagOptions.filter((o) => o.archived)

          return (
            <div key={flag.id} className="rounded-md border border-gray-200 p-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: flag.color }} />
                <h3 className="text-sm font-semibold text-gray-900">{flag.name}</h3>
                <span className="text-xs text-gray-400">{flag.project_id ? 'This project' : 'Global'}</span>
              </div>

              <ul className="mt-2 space-y-1">
                {active.map((opt, i) => (
                  <li key={opt.id} className="flex items-center gap-2 rounded-md bg-gray-50 px-2 py-1">
                    <div className="flex flex-col">
                      <button
                        type="button"
                        disabled={i === 0}
                        onClick={() => onReorderOption(opt.id, 'up')}
                        className="text-[10px] leading-none text-gray-400 hover:text-gray-700 disabled:opacity-20"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={i === active.length - 1}
                        onClick={() => onReorderOption(opt.id, 'down')}
                        className="text-[10px] leading-none text-gray-400 hover:text-gray-700 disabled:opacity-20"
                      >
                        ▼
                      </button>
                    </div>
                    <input
                      type="color"
                      value={opt.color}
                      onChange={(e) => onUpdateOption(opt.id, { color: e.target.value })}
                      className="h-6 w-8 rounded border border-gray-300"
                    />
                    <input
                      defaultValue={opt.label}
                      onBlur={(e) => {
                        if (e.target.value.trim() && e.target.value !== opt.label) {
                          onUpdateOption(opt.id, { label: e.target.value.trim() })
                        } else {
                          e.target.value = opt.label
                        }
                      }}
                      className="flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-sm hover:border-gray-200 focus:border-indigo-400 focus:bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => onUpdateOption(opt.id, { archived: true })}
                      className="text-xs text-gray-500 hover:text-red-600"
                    >
                      Archive
                    </button>
                  </li>
                ))}
              </ul>

              {archived.length > 0 && (
                <ul className="mt-1 space-y-1">
                  {archived.map((opt) => (
                    <li
                      key={opt.id}
                      className="flex items-center gap-2 rounded-md bg-gray-50 px-2 py-1 text-gray-400 line-through"
                    >
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: opt.color }} />
                      <span className="flex-1 text-sm">{opt.label}</span>
                      <button
                        type="button"
                        onClick={() => onUpdateOption(opt.id, { archived: false })}
                        className="text-xs text-indigo-600 no-underline hover:text-indigo-500"
                      >
                        Unarchive
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-2">
                <NewOptionForm onCreate={(label, color) => onCreateOption(flag.id, label, color)} />
              </div>
            </div>
          )
        })}
      </div>
    </Modal>
  )
}
