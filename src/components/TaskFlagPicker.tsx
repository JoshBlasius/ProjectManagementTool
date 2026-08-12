import { contrastTextColor } from '../lib/color'
import type { FlagOptionRow, FlagRow } from '../types/database'

interface TaskFlagPickerProps {
  flags: FlagRow[]
  options: FlagOptionRow[]
  selectedOptionIds: string[]
  onToggle: (flagOptionId: string, nextSelected: boolean) => void
}

export function TaskFlagPicker({ flags, options, selectedOptionIds, onToggle }: TaskFlagPickerProps) {
  const selectedSet = new Set(selectedOptionIds)
  const flagsWithOptions = flags
    .map((flag) => ({
      flag,
      options: options
        .filter((o) => o.flag_id === flag.id && !o.archived)
        .sort((a, b) => a.sort_order - b.sort_order),
    }))
    .filter((f) => f.options.length > 0)

  if (flagsWithOptions.length === 0) {
    return <p className="text-sm text-gray-400">No flags defined yet — manage flags from the project page.</p>
  }

  return (
    <div className="space-y-3">
      {flagsWithOptions.map(({ flag, options: flagOptions }) => (
        <div key={flag.id}>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{flag.name}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {flagOptions.map((opt) => {
              const isSelected = selectedSet.has(opt.id)
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onToggle(opt.id, !isSelected)}
                  className="rounded-full border px-2 py-0.5 text-xs font-medium"
                  style={
                    isSelected
                      ? { backgroundColor: opt.color, borderColor: opt.color, color: contrastTextColor(opt.color) }
                      : { backgroundColor: 'transparent', borderColor: opt.color, color: opt.color }
                  }
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
