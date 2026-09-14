import { useId, type ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'

export interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'value'> {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
}

export function Toggle({ checked, onChange, label, disabled, id, className, ...rest }: ToggleProps) {
  const generatedId = useId()
  const toggleId = id ?? generatedId

  const track = (
    <button
      id={toggleId}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label ? undefined : rest['aria-label']}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-mesa-full transition-colors',
        'duration-[var(--mesa-duration-micro)] ease-mesa-standard outline-none',
        'focus-visible:[box-shadow:var(--mesa-focus-ring-confirm)]',
        disabled && 'cursor-not-allowed opacity-40',
        checked ? 'bg-mesa-teal-500' : 'bg-mesa-neutral-300 dark:bg-mesa-neutral-700',
        className,
      )}
      {...rest}
    >
      <span
        className={clsx(
          'inline-block size-5 translate-x-0.5 rounded-mesa-full bg-white shadow-mesa-1 transition-transform',
          'duration-[var(--mesa-duration-micro)] ease-mesa-standard',
          checked && 'translate-x-[22px]',
        )}
      />
    </button>
  )

  if (!label) return track

  return (
    <label htmlFor={toggleId} className="inline-flex items-center gap-3">
      <span className="text-sm text-mesa-text-primary">{label}</span>
      {track}
    </label>
  )
}
