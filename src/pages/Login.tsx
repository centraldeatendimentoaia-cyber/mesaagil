import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export function Login() {
  const navigate = useNavigate()
  const { entrar } = useAuth()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [entrando, setEntrando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function aoSubmeter(e: FormEvent) {
    e.preventDefault()
    if (entrando) return

    setEntrando(true)
    setErro(null)

    const resultado = await entrar(email.trim(), senha)

    if (resultado.erro) {
      setErro(resultado.erro)
      setEntrando(false)
      return
    }

    navigate('/')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6 dark:bg-neutral-950">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <h1 className="text-4xl font-black text-[#C4372A]">AIA</h1>
          <p className="mt-1 text-base text-neutral-500 dark:text-neutral-400">
            Bem-vindo ao MesaAgil
          </p>
        </div>

        <form
          onSubmit={aoSubmeter}
          className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
        >
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

          <label className="mt-4 block">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">Senha</span>
            <div className="relative mt-1">
              <input
                type={mostrarSenha ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="h-11 w-full rounded-2xl border border-neutral-300 bg-white px-4 pr-11 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((v) => !v)}
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-neutral-400"
              >
                {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {erro && <p className="mt-4 text-sm font-medium text-red-600">{erro}</p>}

          <button
            type="submit"
            disabled={entrando}
            className="mt-6 min-h-11 w-full rounded-2xl bg-[#C4372A] text-base font-semibold text-white disabled:opacity-60"
          >
            {entrando ? 'Entrando...' : 'Entrar'}
          </button>

          <Link
            to="/esqueci-senha"
            className="mt-4 block text-center text-sm text-neutral-500 dark:text-neutral-400"
          >
            Esqueci minha senha
          </Link>
        </form>
      </div>
    </div>
  )
}
