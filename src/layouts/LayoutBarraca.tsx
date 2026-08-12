import { Outlet, useParams } from 'react-router-dom'
import { useBarraca } from '../hooks/useBarraca'
import { useSincronizacao } from '../hooks/useSincronizacao'
import { NaoEncontrado } from '../pages/NaoEncontrado'
import { BarracaContext, SincronizacaoContext } from './contextoBarraca'

export function LayoutBarraca() {
  const { slug } = useParams<{ slug: string }>()
  const { barraca, carregando, erro } = useBarraca(slug ?? '')
  const sincronizacao = useSincronizacao()

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-cozinha-fundo">
        <p className="text-neutral-500 dark:text-neutral-400">Carregando...</p>
      </div>
    )
  }

  if (erro || !barraca) {
    return <NaoEncontrado />
  }

  return (
    <BarracaContext.Provider value={barraca}>
      <SincronizacaoContext.Provider value={sincronizacao}>
        <Outlet />
      </SincronizacaoContext.Provider>
    </BarracaContext.Provider>
  )
}
