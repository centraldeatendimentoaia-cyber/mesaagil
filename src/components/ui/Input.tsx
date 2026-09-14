import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'
import { Eye, EyeOff, Search, X, AlertCircle } from 'lucide-react'
import clsx from 'clsx'

export type InputType = 'text' | 'email' | 'password' | 'number' | 'currency' | 'percentage' | 'search'
export type InputSize = 'sm' | 'md' | 'lg'

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'prefix'> {
  label?: string
  helpText?: string
  error?: string
  type?: InputType
  size?: InputSize
  onClear?: () => void
}

const heightClasses: Record<InputSize, string> = {
  sm: 'h-10',
  md: 'h-12',
  lg: 'h-14',
}

const nativeTypeFor = (type: InputType, passwordVisible: boolean): string => {
  switch (type) {
    case 'password':
      return passwordVisible ? 'text' : 'password'
    case 'number':
      return 'number'
    case 'currency':
    case 'percentage':
      return 'text'
    case 'search':
      return 'search'
    default:
      return type
  }
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    helpText,
    error,
    type = 'text',
    size = 'md',
    className,
    id,
    disabled,
    value,
    onClear,
    ...rest
  },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const helpId = `${inputId}-help`
  const [passwordVisible, setPasswordVisible] = useState(false)

  const hasError = Boolean(error)
  const showClear = type === 'search' && onClear && typeof value === 'string' && value.length > 0

  let leftAffix: ReactNode = null
  let rightAffix: ReactNode = null

  if (type === 'currency') {
    leftAffix = <span className="text-mesa-text-secondary">R$</span>
  } else if (type === 'search') {
    leftAffix = <Search className="size-4 text-mesa-text-secondary" aria-hidden />
  }

  if (type === 'percentage') {
    rightAffix = <span className="text-mesa-text-secondary">%</span>
  } else if (type === 'password') {
    rightAffix = (
      <button
        type="button"
        onClick={() => setPasswordVisible((v) => !v)}
        disabled={disabled}
        aria-label={passwordVisible ? 'Ocultar senha' : 'Mostrar senha'}
        className="flex size-11 -mr-3 shrink-0 items-center justify-center text-mesa-text-secondary disabled:cursor-not-allowed"
      >
        {passwordVisible ? <EyeOff className="size-[18px]" aria-hidden /> : <Eye className="size-[18px]" aria-hidden />}
      </button>
    )
  } else if (showClear) {
    rightAffix = (
      <button
        type="button"
        onClick={onClear}
        aria-label="Limpar campo"
        className="flex size-11 -mr-3 shrink-0 items-center justify-center text-mesa-text-secondary"
      >
        <X className="size-4" aria-hidden />
      </button>
    )
  } else if (hasError && (type === 'text' || type === 'email' || type === 'number' || type === 'currency')) {
    rightAffix = <AlertCircle className="size-4 text-mesa-error-500" aria-hidden />
  }

  return (
    <div className={clsx('flex flex-col', className)}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 text-xs font-semibold text-mesa-neutral-700 dark:text-mesa-neutral-300">
          {label}
        </label>
      )}
      <div
        className={clsx(
          'flex items-center gap-2 rounded-mesa-sm border-[1.5px] px-4 transition-colors duration-[var(--mesa-duration-micro)]',
          heightClasses[size],
          disabled
            ? 'cursor-not-allowed bg-mesa-neutral-100 border-mesa-neutral-200 opacity-50 dark:bg-mesa-neutral-800 dark:border-mesa-neutral-700'
            : hasError
              ? 'bg-mesa-surface border-mesa-error-500 focus-within:[box-shadow:var(--mesa-focus-ring-danger)]'
              : 'bg-mesa-surface border-mesa-border-default ' +
                'focus-within:border-mesa-orange-500 focus-within:[box-shadow:var(--mesa-focus-ring-primary)]',
        )}
      >
        {leftAffix}
        <input
          ref={ref}
          id={inputId}
          type={nativeTypeFor(type, passwordVisible)}
          disabled={disabled}
          value={value}
          aria-invalid={hasError || undefined}
          aria-describedby={helpText || error ? helpId : undefined}
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-mesa-text-primary placeholder:text-mesa-text-tertiary outline-none disabled:cursor-not-allowed"
          {...rest}
        />
        {rightAffix}
      </div>
      {(helpText || error) && (
        <p
          id={helpId}
          className={clsx('mt-1.5 text-xs', hasError ? 'text-mesa-error-500' : 'text-mesa-text-secondary')}
        >
          {error || helpText}
        </p>
      )}
    </div>
  )
})
