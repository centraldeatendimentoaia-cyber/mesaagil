import type { HTMLAttributes } from 'react'
import clsx from 'clsx'

export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'highlight' | 'successOutline'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  dot?: boolean
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'bg-mesa-neutral-100 text-mesa-neutral-700 dark:bg-mesa-neutral-700 dark:text-mesa-neutral-200',
  success: 'bg-mesa-teal-50 text-mesa-teal-700 dark:bg-mesa-teal-500/15 dark:text-mesa-teal-400',
  warning: 'bg-mesa-orange-50 text-mesa-orange-700 dark:bg-mesa-orange-500/15 dark:text-mesa-orange-400',
  danger: 'bg-mesa-error-50 text-mesa-error-700 dark:bg-mesa-error-500/15 dark:text-mesa-error-400',
  info: 'bg-mesa-info-50 text-mesa-info-700 dark:bg-mesa-info-500/15 dark:text-mesa-info-400',
  highlight: 'bg-mesa-orange-500 text-white',
  successOutline: 'border border-mesa-teal-500 bg-transparent text-mesa-teal-700 dark:text-mesa-teal-300',
}

const dotClasses: Record<BadgeVariant, string> = {
  neutral: 'bg-mesa-neutral-500',
  success: 'bg-mesa-teal-500',
  warning: 'bg-mesa-orange-500',
  danger: 'bg-mesa-error-500',
  info: 'bg-mesa-info-500',
  highlight: 'bg-white',
  successOutline: 'bg-mesa-teal-500',
}

export function Badge({ variant = 'neutral', dot = false, className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-mesa-full px-3 py-1 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
      {...rest}
    >
      {dot && <span className={clsx('size-1.5 shrink-0 rounded-mesa-full', dotClasses[variant])} aria-hidden />}
      {children}
    </span>
  )
}
