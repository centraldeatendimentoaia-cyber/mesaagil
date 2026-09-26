import { useEffect, useId, useRef, useState, type InputHTMLAttributes } from 'react'
import clsx from 'clsx'
import { Icone } from './Icone'

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'onChange'> {
  checked: boolean
  onChange: (checked: boolean) => void
  indeterminate?: boolean
  label?: string
  size?: 'md' | 'lg'
  strikeThroughWhenChecked?: boolean
}

const boxSizeClasses = {
  md: 'size-5',
  lg: 'size-6',
}

export function Checkbox({
  checked,
  onChange,
  indeterminate = false,
  label,
  size = 'md',
  strikeThroughWhenChecked = false,
  disabled,
  id,
  className,
  ...rest
}: CheckboxProps) {
  const generatedId = useId()
  const checkboxId = id ?? generatedId
  const inputRef = useRef<HTMLInputElement>(null)
  const [pulsing, setPulsing] = useState(false)
  const [prevChecked, setPrevChecked] = useState(checked)

  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate
  }, [indeterminate])

  if (checked !== prevChecked) {
    setPrevChecked(checked)
    if (checked) setPulsing(true)
  }

  useEffect(() => {
    if (!pulsing) return
    const timeout = setTimeout(() => setPulsing(false), 250)
    return () => clearTimeout(timeout)
  }, [pulsing])

  return (
    <label
      htmlFor={checkboxId}
      className={clsx('inline-flex min-h-11 items-center gap-2.5', disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer', className)}
    >
      <span className="relative inline-flex shrink-0">
        <input
          ref={inputRef}
          id={checkboxId}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
          {...rest}
        />
        <span
          aria-hidden
          className={clsx(
            boxSizeClasses[size],
            'inline-flex items-center justify-center rounded-mesa-xs border-[1.5px] transition-transform',
            'duration-[var(--mesa-duration-short)] ease-mesa-spring-soft',
            'peer-focus-visible:[box-shadow:var(--mesa-focus-ring-confirm)]',
            checked || indeterminate
              ? 'border-mesa-neutral-900 bg-mesa-neutral-900 dark:border-mesa-neutral-50 dark:bg-mesa-neutral-50'
              : 'border-mesa-neutral-300 bg-transparent dark:border-mesa-neutral-600',
            pulsing && 'scale-[1.15]',
          )}
        >
          {indeterminate ? (
            <Icone nome="remove" size={14} peso={700} className="text-white dark:text-mesa-neutral-900" />
          ) : checked ? (
            <Icone nome="check" size={14} peso={700} className="text-white dark:text-mesa-neutral-900" />
          ) : null}
        </span>
      </span>
      {label && (
        <span
          className={clsx(
            'text-sm text-mesa-text-primary',
            checked && strikeThroughWhenChecked && 'text-mesa-neutral-400 line-through',
          )}
        >
          {label}
        </span>
      )}
    </label>
  )
}
