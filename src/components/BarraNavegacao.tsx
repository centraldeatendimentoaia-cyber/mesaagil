import { NavLink } from 'react-router-dom'
import { ShoppingBag, ChefHat, Volume2, History, Settings, type LucideIcon } from 'lucide-react'
import clsx from 'clsx'
import { useBarracaAtual } from '../layouts/contextoBarraca'
import { usePedidosAtual } from '../layouts/contextoPedidos'

const ITENS: { rotulo: string; rota: string; icone: LucideIcon }[] = [
  { rotulo: 'Lançar', rota: 'lancar', icone: ShoppingBag },
  { rotulo: 'Cozinha', rota: 'cozinha', icone: ChefHat },
  { rotulo: 'Chamada', rota: 'chamada', icone: Volume2 },
  { rotulo: 'Histórico', rota: 'historico', icone: History },
  { rotulo: 'Ajustes', rota: 'ajustes', icone: Settings },
]

export function BarraNavegacao() {
  const barraca = useBarracaAtual()
  const { contagemAFazer } = usePedidosAtual()

  return (
    <nav
      className={clsx(
        'fixed inset-x-0 bottom-0 z-[var(--mesa-z-nav)] flex h-16 pb-[env(safe-area-inset-bottom)]',
        'bg-white/85 backdrop-blur-md dark:bg-mesa-neutral-800/85 shadow-mesa-nav-top',
      )}
    >
      {ITENS.map((item) => {
        const Icone = item.icone
        const mostrarBadge = item.rota === 'cozinha' && contagemAFazer > 0

        return (
          <NavLink
            key={item.rota}
            to={`/${barraca.slug}/${item.rota}`}
            className={({ isActive }) =>
              clsx(
                'flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5',
                'transition-colors duration-[var(--mesa-duration-micro)]',
                isActive ? 'text-mesa-teal-700 dark:text-mesa-teal-400' : 'text-mesa-neutral-500',
              )
            }
          >
            <span className="relative inline-flex">
              <Icone size={24} aria-hidden />
              {mostrarBadge && (
                <span
                  aria-hidden
                  className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-mesa-full bg-mesa-orange-500 px-0.5 text-[10px] font-bold leading-none text-white"
                >
                  {contagemAFazer > 9 ? '9+' : contagemAFazer}
                </span>
              )}
            </span>
            <span className="text-[11px] leading-[14px]">
              {item.rotulo}
              {mostrarBadge && (
                <span className="sr-only"> — {contagemAFazer} pedido(s) a fazer</span>
              )}
            </span>
          </NavLink>
        )
      })}
    </nav>
  )
}
