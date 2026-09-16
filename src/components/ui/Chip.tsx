import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import { Check } from 'lucide-react'
import clsx from 'clsx'

export type ChipVariant = 'teal' | 'plain'

interface ChipBaseProps {
  checked?: boolean
  variant?: ChipVariant
  disabled?: boolean
  className?: string
  children?: ReactNode
}

export type ChipProps = ChipBaseProps &
  (
    | ({ onClick: ButtonHTMLAttributes<HTMLButtonElement>['onClick'] } & Omit<
        ButtonHTMLAttributes<HTMLButtonElement>,
        keyof ChipBaseProps | 'onClick'
      >)
    | ({ onClick?: undefined } & Omit<HTMLAttributes<HTMLSpanElement>, keyof ChipBaseProps>)
  )

const variantClasses: Record<ChipVariant, string> = {
  teal: 'bg-mesa-teal-50 text-mesa-teal-700 dark:bg-mesa-teal-500/15 dark:text-mesa-teal-300',
  plain: 'bg-mesa-neutral-100 text-mesa-neutral-700 dark:bg-mesa-neutral-700 dark:text-mesa-neutral-200',
}

export function Chip({ checked = false, variant = 'teal', disabled, className, children, onClick, ...rest }: ChipProps) {
  const chipClassName = clsx(
    'inline-flex items-center gap-1.5 rounded-mesa-full px-3 py-2 text-sm font-medium',
    disabled && 'cursor-not-allowed opacity-40',
    variantClasses[variant],
    className,
  )
  const content = (
    <>
      {checked && <Check className="size-3.5 shrink-0" strokeWidth={3} aria-hidden />}
      {children}
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={checked}
        className={clsx(chipClassName, 'outline-none focus-visible:[box-shadow:var(--mesa-focus-ring-confirm)]')}
        {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {content}
      </button>
    )
  }

  return (
    <span className={chipClassName} {...(rest as HTMLAttributes<HTMLSpanElement>)}>
      {content}
    </span>
  )
}
