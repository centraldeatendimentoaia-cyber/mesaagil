import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { useBarracasDoUsuario } from '../hooks/useBarracasDoUsuario'
import { Button } from './ui/Button'

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
      <div className="flex min-h-dvh items-center justify-center bg-mesa-bg-base">
        <p className="text-mesa-text-secondary">Carregando...</p>
      </div>
    )
  }

  if (carregandoBarracas) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-mesa-bg-base">
        <p className="text-mesa-text-secondary">Carregando...</p>
      </div>
    )
  }

  if (verificarSlug) {
    const slugAtual = location.pathname.split('/')[1] ?? ''
    const temAcesso = barracas.some((b) => b.barraca.slug === slugAtual)

    if (!temAcesso) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-mesa-bg-base p-6 text-center">
          <p className="text-base text-mesa-text-secondary">
            Você não tem acesso a esta barraca.
          </p>
          <Button variant="primary" size="lg" onClick={() => navigate('/')}>
            Ir para minhas barracas
          </Button>
        </div>
      )
    }
  }

  return <>{children}</>
}
