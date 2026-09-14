import { forwardRef, useId, type TextareaHTMLAttributes } from 'react'
import clsx from 'clsx'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  helpText?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, helpText, error, className, id, disabled, maxLength, value, ...rest },
  ref,
) {
  const generatedId = useId()
  const textareaId = id ?? generatedId
  const helpId = `${textareaId}-help`
  const hasError = Boolean(error)
  const currentLength = typeof value === 'string' ? value.length : undefined

  return (
    <div className={clsx('flex flex-col', className)}>
      {label && (
        <label
          htmlFor={textareaId}
          className="mb-1.5 text-xs font-semibold text-mesa-neutral-700 dark:text-mesa-neutral-300"
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        disabled={disabled}
        maxLength={maxLength}
        value={value}
        aria-invalid={hasError || undefined}
        aria-describedby={helpText || error ? helpId : undefined}
        className={clsx(
          'min-h-[88px] resize-y rounded-mesa-sm border-[1.5px] px-4 py-3 text-sm text-mesa-text-primary',
          'placeholder:text-mesa-text-tertiary outline-none transition-colors duration-[var(--mesa-duration-micro)]',
          disabled
            ? 'cursor-not-allowed bg-mesa-neutral-100 border-mesa-neutral-200 opacity-50 dark:bg-mesa-neutral-800 dark:border-mesa-neutral-700'
            : hasError
              ? 'bg-mesa-surface border-mesa-error-500 focus:[box-shadow:var(--mesa-focus-ring-danger)]'
              : 'bg-mesa-surface border-mesa-border-default ' +
                'focus:border-mesa-orange-500 focus:[box-shadow:var(--mesa-focus-ring-primary)]',
        )}
        {...rest}
      />
      <div className="mt-1.5 flex items-start justify-between gap-2">
        {(helpText || error) && (
          <p
            id={helpId}
            className={clsx('text-xs', hasError ? 'text-mesa-error-500' : 'text-mesa-text-secondary')}
          >
            {error || helpText}
          </p>
        )}
        {maxLength !== undefined && currentLength !== undefined && (
          <span className="ml-auto shrink-0 text-[11px] text-mesa-text-tertiary">
            {currentLength}/{maxLength}
          </span>
        )}
      </div>
    </div>
  )
})
