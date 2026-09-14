import { useId, type InputHTMLAttributes } from 'react'
import clsx from 'clsx'

export interface RadioProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'onChange'> {
  checked: boolean
  onChange: (value: string) => void
  label?: string
}

export function Radio({ checked, onChange, label, disabled, id, value, className, ...rest }: RadioProps) {
  const generatedId = useId()
  const radioId = id ?? generatedId

  return (
    <label
      htmlFor={radioId}
      className={clsx('inline-flex items-center gap-2.5', disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer', className)}
    >
      <span className="relative inline-flex shrink-0">
        <input
          id={radioId}
          type="radio"
          checked={checked}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="peer sr-only"
          {...rest}
        />
        <span
          aria-hidden
          className={clsx(
            'inline-flex size-5 items-center justify-center rounded-mesa-full border-[1.5px] p-[3px]',
            'transition-colors duration-[var(--mesa-duration-micro)]',
            'peer-focus-visible:[box-shadow:var(--mesa-focus-ring-confirm)]',
            checked ? 'border-mesa-teal-500' : 'border-mesa-neutral-300 dark:border-mesa-neutral-600',
          )}
        >
          <span
            className={clsx(
              'size-full rounded-mesa-full transition-transform duration-[var(--mesa-duration-micro)]',
              checked ? 'scale-100 bg-mesa-teal-500' : 'scale-0 bg-transparent',
            )}
          />
        </span>
      </span>
      {label && <span className="text-sm text-mesa-text-primary">{label}</span>}
    </label>
  )
}
