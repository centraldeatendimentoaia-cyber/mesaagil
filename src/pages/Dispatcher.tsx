import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useBarracasDoUsuario } from '../hooks/useBarracasDoUsuario'

export function Dispatcher() {
  const navigate = useNavigate()
  const { usuario, carregando: carregandoAuth, sair } = useAuth()
  const { barracas, carregando: carregandoBarracas, erro } = useBarracasDoUsuario(usuario)

  useEffect(() => {
    if (carregandoAuth) return

    if (!usuario) {
      navigate('/login', { replace: true })
      return
    }

    if (carregandoBarracas) return
    if (erro || barracas.length === 0) return

    if (barracas.length === 1) {
      navigate(`/${barracas[0].barraca.slug}`, { replace: true })
      return
    }

    navigate('/selecionar-barraca', { replace: true })
  }, [usuario, carregandoAuth, barracas, carregandoBarracas, erro, navigate])

  if (carregandoAuth || (usuario && carregandoBarracas)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-neutral-950">
        <p className="text-neutral-500 dark:text-neutral-400">Carregando...</p>
      </div>
    )
  }

  if (usuario && (erro || barracas.length === 0)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white p-6 text-center dark:bg-neutral-950">
        <p className="text-base text-neutral-700 dark:text-neutral-300">
          Nenhuma barraca vinculada à sua conta. Entre em contato com o suporte.
        </p>
        <button
          type="button"
          onClick={async () => {
            await sair()
            navigate('/login')
          }}
          className="min-h-11 rounded-2xl bg-neutral-200 px-6 text-base font-medium text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
        >
          Sair
        </button>
      </div>
    )
  }

  return null
}
