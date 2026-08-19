import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useBarracasDoUsuario } from '../hooks/useBarracasDoUsuario'

export function RotaProtegida({
  children,
  verificarSlug = false,
}: {
  children: ReactNode
  verificarSlug?: boolean
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const { usuario, carregando: carregandoAuth } = useAuth()
  const { barracas, carregando: carregandoBarracas } = useBarracasDoUsuario(usuario)

  useEffect(() => {
    if (!carregandoAuth && !usuario) {
      navigate('/login', { replace: true })
    }
  }, [carregandoAuth, usuario, navigate])

  if (carregandoAuth || !usuario) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-neutral-950">
        <p className="text-neutral-500 dark:text-neutral-400">Carregando...</p>
      </div>
    )
  }

  if (carregandoBarracas) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-neutral-950">
        <p className="text-neutral-500 dark:text-neutral-400">Carregando...</p>
      </div>
    )
  }

  if (verificarSlug) {
    const slugAtual = location.pathname.split('/')[1] ?? ''
    const temAcesso = barracas.some((b) => b.barraca.slug === slugAtual)

    if (!temAcesso) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white p-6 text-center dark:bg-neutral-950">
          <p className="text-base text-neutral-700 dark:text-neutral-300">
            Você não tem acesso a esta barraca.
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="min-h-11 rounded-2xl bg-neutral-200 px-6 text-base font-medium text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
          >
            Ir para minhas barracas
          </button>
        </div>
      )
    }
  }

  return <>{children}</>
}
