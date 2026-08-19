import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function RedefinirSenha() {
  const navigate = useNavigate()

  const [novaSenha, setNovaSenha] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [salvo, setSalvo] = useState(false)

  async function aoSubmeter(e: FormEvent) {
    e.preventDefault()
    if (salvando) return

    setSalvando(true)
    setErro(null)

    const { error } = await supabase.auth.updateUser({ password: novaSenha })

    setSalvando(false)

    if (error) {
      setErro('Não foi possível salvar a nova senha. Tente novamente.')
      return
    }

    setSalvo(true)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6 dark:bg-neutral-950">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Nova senha</h1>

        {salvo ? (
          <>
            <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
              Senha atualizada com sucesso.
            </p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="mt-6 min-h-11 w-full rounded-2xl bg-[#C4372A] text-base font-semibold text-white"
            >
              Ir para o login
            </button>
          </>
        ) : (
          <form onSubmit={aoSubmeter} className="mt-4">
            <label className="block">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Nova senha</span>
              <input
                type="password"
                autoComplete="new-password"
                autoFocus
                required
                minLength={6}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                className="mt-1 h-11 w-full rounded-2xl border border-neutral-300 bg-white px-4 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
              />
            </label>

            {erro && <p className="mt-3 text-sm text-red-600">{erro}</p>}

            <button
              type="submit"
              disabled={salvando}
              className="mt-6 min-h-11 w-full rounded-2xl bg-[#C4372A] text-base font-semibold text-white disabled:opacity-60"
            >
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
