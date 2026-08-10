import { createContext, useContext } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import { useBarraca } from '../hooks/useBarraca'
import { NaoEncontrado } from '../pages/NaoEncontrado'
import type { Barraca } from '../types/database'

const BarracaContext = createContext<Barraca | null>(null)

export function useBarracaAtual(): Barraca {
  const barraca = useContext(BarracaContext)
  if (!barraca) {
    throw new Error('useBarracaAtual precisa ser usado dentro de LayoutBarraca')
  }
  return barraca
}

export function LayoutBarraca() {
  const { slug } = useParams<{ slug: string }>()
  const { barraca, carregando, erro } = useBarraca(slug ?? '')

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
      <Outlet />
    </BarracaContext.Provider>
  )
}
