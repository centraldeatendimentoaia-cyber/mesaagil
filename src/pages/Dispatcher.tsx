import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useBarracasDoUsuario } from '../hooks/useBarracasDoUsuario'
import { Button } from '../components/ui/Button'

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
    if (erro) return

    if (barracas.length === 1) {
      navigate(`/${barracas[0].barraca.slug}`, { replace: true })
      return
    }

    // 0 barracas cai aqui também — SelecionarBarraca mostra o convite pra
    // criar a primeira, em vez de um beco sem saída.
    navigate('/selecionar-barraca', { replace: true })
  }, [usuario, carregandoAuth, barracas, carregandoBarracas, erro, navigate])

  if (carregandoAuth || (usuario && carregandoBarracas)) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-mesa-text-secondary">Carregando...</p>
      </div>
    )
  }

  if (usuario && erro) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-base text-mesa-text-primary">
          Não foi possível carregar suas barracas. Tente novamente.
        </p>
        <Button
          variant="ghost"
          size="md"
          onClick={async () => {
            await sair()
            navigate('/login')
          }}
        >
          Sair
        </Button>
      </div>
    )
  }

  return null
}
