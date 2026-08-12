import { contrastTextColor } from '../lib/color'
import type { FlagOptionRow } from '../types/database'

interface FlagPillsProps {
  optionIds: string[]
  options: FlagOptionRow[]
  size?: 'xs' | 'sm'
}

export function FlagPills({ optionIds, options, size = 'sm' }: FlagPillsProps) {
  if (optionIds.length === 0) return null
  const byId = new Map(options.map((o) => [o.id, o]))
  const selected = optionIds.map((id) => byId.get(id)).filter((o): o is FlagOptionRow => !!o)
  if (selected.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1">
      {selected.map((opt) => (
        <span
          key={opt.id}
          className={`inline-flex items-center rounded-full font-medium ${
            size === 'xs' ? 'px-1.5 py-0 text-[10px]' : 'px-2 py-0.5 text-xs'
          }`}
          style={{ backgroundColor: opt.color, color: contrastTextColor(opt.color) }}
        >
          {opt.label}
        </span>
      ))}
    </div>
  )
}
