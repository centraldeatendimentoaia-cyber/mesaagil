import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function EsqueciSenha() {
  const { resetarSenha } = useAuth()

  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  async function aoSubmeter(e: FormEvent) {
    e.preventDefault()
    if (enviando) return

    setEnviando(true)
    await resetarSenha(email.trim())
    setEnviando(false)
    setEnviado(true)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6 dark:bg-neutral-950">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
          Esqueci minha senha
        </h1>

        {enviado ? (
          <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
            Se este email existir, um link foi enviado. Confira sua caixa e o spam.
          </p>
        ) : (
          <form onSubmit={aoSubmeter} className="mt-4">
            <label className="block">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Email</span>
              <input
                type="email"
                autoComplete="email"
                autoFocus
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 h-11 w-full rounded-2xl border border-neutral-300 bg-white px-4 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
              />
            </label>

            <button
              type="submit"
              disabled={enviando}
              className="mt-6 min-h-11 w-full rounded-2xl bg-[#C4372A] text-base font-semibold text-white disabled:opacity-60"
            >
              {enviando ? 'Enviando...' : 'Enviar link de recuperação'}
            </button>
          </form>
        )}

        <Link
          to="/login"
          className="mt-4 block text-center text-sm text-neutral-500 dark:text-neutral-400"
        >
          Voltar pro login
        </Link>
      </div>
    </div>
  )
}
