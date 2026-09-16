import { Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { useBarracaAtual } from '../../layouts/contextoBarraca'

/**
 * Ícone de 20px, área de toque 44×44 (regra do CLAUDE.md). Por padrão
 * navega direto pro Dashboard (`/:slug`); telas com estado que seria
 * perdido no caminho (ex.: ConfirmarPedido) passam `onClick` pra
 * interceptar e confirmar antes.
 */
export function BotaoHome({ onClick, className }: { onClick?: () => void; className?: string }) {
  const barraca = useBarracaAtual()
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={onClick ?? (() => navigate(`/${barraca.slug}`))}
      aria-label="Ir para o início"
      className={clsx(
        'flex size-11 shrink-0 items-center justify-center text-mesa-text-secondary outline-none',
        className,
      )}
    >
      <Home className="size-5" aria-hidden />
    </button>
  )
}
