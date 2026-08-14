import { NavLink } from 'react-router-dom'
import { useBarracaAtual } from '../layouts/contextoBarraca'

const ITENS = [
  { rotulo: 'Lançar', rota: '', icone: '📝' },
  { rotulo: 'Cozinha', rota: 'cozinha', icone: '🍳' },
  { rotulo: 'Chamada', rota: 'chamada', icone: '📣' },
  { rotulo: 'Histórico', rota: 'historico', icone: '🕘' },
  { rotulo: 'Ajustes', rota: 'ajustes', icone: '⚙️' },
]

export function BarraNavegacao() {
  const barraca = useBarracaAtual()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-neutral-800 dark:bg-neutral-950">
      {ITENS.map((item) => (
        <NavLink
          key={item.rota}
          to={`/${barraca.slug}${item.rota ? `/${item.rota}` : ''}`}
          end={item.rota === ''}
          className={({ isActive }) =>
            `flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium ${
              isActive
                ? 'text-marca'
                : 'text-neutral-500 dark:text-neutral-400'
            }`
          }
        >
          <span aria-hidden className="text-lg leading-none">
            {item.icone}
          </span>
          {item.rotulo}
        </NavLink>
      ))}
    </nav>
  )
}
