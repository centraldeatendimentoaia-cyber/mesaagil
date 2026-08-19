import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useBarracasDoUsuario } from '../hooks/useBarracasDoUsuario'

export function SelecionarBarraca() {
  const navigate = useNavigate()
  const { usuario, sair } = useAuth()
  const { barracas, carregando } = useBarracasDoUsuario(usuario)

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-neutral-950">
        <p className="text-neutral-500 dark:text-neutral-400">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-white p-6 dark:bg-neutral-950">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Qual barraca?</h1>

      <div className="mt-6 flex flex-col gap-3">
        {barracas.map(({ barraca }) => (
          <button
            key={barraca.id}
            type="button"
            onClick={() => navigate(`/${barraca.slug}`)}
            className="flex min-h-16 items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3 text-left active:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:active:bg-neutral-800"
          >
            {barraca.logo_url ? (
              <img
                src={barraca.logo_url}
                alt=""
                className="h-11 w-11 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-200 text-lg font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                {barraca.nome.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {barraca.nome}
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={async () => {
          await sair()
          navigate('/login')
        }}
        className="mt-auto min-h-11 self-center px-4 text-sm font-medium text-neutral-500 dark:text-neutral-400"
      >
        Sair
      </button>
    </div>
  )
}
