import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import clsx from 'clsx'

export type ButtonVariant = 'primary' | 'confirm' | 'destructive' | 'outline' | 'ghost' | 'textDanger'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  loading?: boolean
}

const baseClasses =
  'relative inline-flex select-none items-center justify-center gap-2 text-center font-medium ' +
  'transition-[background-color,color,transform,box-shadow] duration-[var(--mesa-duration-micro)] ease-mesa-standard ' +
  'active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 outline-none'

// Realce tátil sutil (inset de luz no topo) nos botões de ação sólidos —
// traço do redesign "Speed Bento POS" (emula um switch físico). Cede
// lugar ao anel de foco quando focado via teclado, já que box-shadow não
// acumula entre estados sem repetir o valor inteiro.
const realceTatil = '[box-shadow:inset_0_1px_0_rgba(255,255,255,0.3)]'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    `rounded-mesa-full bg-mesa-orange-500 text-white ${realceTatil} hover:bg-mesa-orange-600 active:bg-mesa-orange-700 ` +
    'focus-visible:[box-shadow:var(--mesa-focus-ring-primary)]',
  confirm:
    `rounded-mesa-full bg-mesa-teal-500 text-white ${realceTatil} hover:bg-mesa-teal-600 active:bg-mesa-teal-700 ` +
    'focus-visible:[box-shadow:var(--mesa-focus-ring-confirm)]',
  destructive:
    `rounded-mesa-full bg-mesa-error-500 text-white ${realceTatil} hover:bg-mesa-error-700 active:bg-mesa-error-700 ` +
    'focus-visible:[box-shadow:var(--mesa-focus-ring-danger)]',
  outline:
    'rounded-mesa-full border-[1.5px] border-mesa-teal-500 bg-transparent text-mesa-teal-500 ' +
    'hover:bg-[var(--mesa-state-hover-bg)] active:bg-[var(--mesa-state-active-bg)] ' +
    'focus-visible:[box-shadow:var(--mesa-focus-ring-confirm)]',
  ghost:
    'rounded-mesa-md bg-transparent text-mesa-text-primary hover:bg-[var(--mesa-state-hover-bg)] ' +
    'active:bg-[var(--mesa-state-active-bg)] focus-visible:[box-shadow:var(--mesa-focus-ring-primary)]',
  textDanger:
    'rounded-mesa-md bg-transparent text-mesa-error-500 hover:bg-[var(--mesa-state-hover-bg)] ' +
    'active:bg-[var(--mesa-state-active-bg)] focus-visible:[box-shadow:var(--mesa-focus-ring-danger)]',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-sm whitespace-nowrap',
  md: 'h-11 px-5 text-sm whitespace-nowrap',
  // lg/xl são CTAs de largura total — texto longo quebra em vez de
  // estourar a tela horizontalmente. min-h em vez de h para o botão
  // crescer quando a segunda linha aparece.
  lg: 'min-h-[52px] px-6 py-3 text-base leading-snug',
  xl: 'min-h-[60px] px-6 py-3 text-base font-semibold leading-snug',
}

const spinnerSizeClasses: Record<ButtonSize, string> = {
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-5',
  xl: 'size-6',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    icon,
    iconPosition = 'left',
    loading = false,
    disabled,
    className,
    children,
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading

  return (
    <button
      ref={ref}
      type={rest.type ?? 'button'}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={clsx(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      {...rest}
    >
      <span className={clsx('inline-flex items-center justify-center gap-2', loading && 'invisible')}>
        {icon && iconPosition === 'left' && (
          <span className="inline-flex shrink-0" aria-hidden>
            {icon}
          </span>
        )}
        {children}
        {icon && iconPosition === 'right' && (
          <span className="inline-flex shrink-0" aria-hidden>
            {icon}
          </span>
        )}
      </span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Loader2 className={clsx('animate-spin', spinnerSizeClasses[size])} aria-hidden />
        </span>
      )}
    </button>
  )
})
