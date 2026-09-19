import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { IdCard, LogIn, Lock, Mail } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function Login() {
  const navigate = useNavigate()
  const { entrar } = useAuth()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
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
    <div className="flex min-h-dvh flex-col items-center justify-center p-6 [background:var(--mesa-gradient-atmosphere)]">
      <div className="w-full max-w-[400px]">
        <div className="flex flex-col items-center text-center">
          <div className="flex size-16 items-center justify-center rounded-mesa-xl border border-mesa-border-subtle bg-mesa-surface p-3 shadow-mesa-1">
            <img src="/brand/mesaagil-icone-cor.png" alt="" className="size-full" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-wide text-mesa-text-primary">
            MESA ÁGIL
          </h1>
          <p className="mt-1 text-sm text-mesa-text-secondary">
            Automação Inteligente para Atendimento
          </p>
        </div>

        <div className="mt-8 rounded-mesa-2xl border border-mesa-border-subtle bg-mesa-surface p-6 shadow-mesa-1">
          <div className="mb-6 flex justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-mesa-full bg-mesa-neutral-100 px-3 py-1.5 text-xs font-semibold text-mesa-text-secondary dark:bg-mesa-neutral-700">
              <IdCard className="size-3.5" aria-hidden />
              Credenciais
            </span>
          </div>

          <form onSubmit={aoSubmeter} className="flex flex-col gap-4">
            <Input
              label="E-mail"
              type="email"
              icon={<Mail aria-hidden />}
              autoComplete="email"
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div>
              <Input
                label="Senha de acesso"
                type="password"
                icon={<Lock aria-hidden />}
                autoComplete="current-password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
              <Link
                to="/esqueci-senha"
                className="mt-2 block text-right text-sm font-medium text-mesa-teal-700 dark:text-mesa-teal-300"
              >
                Esqueci minha senha
              </Link>
            </div>

            {erro && <p className="text-sm font-medium text-mesa-error-500">{erro}</p>}

            <Button
              type="submit"
              size="xl"
              icon={<LogIn className="size-5" aria-hidden />}
              loading={entrando}
              className="mt-2 w-full"
            >
              Entrar
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-mesa-text-secondary">
          Não tem conta?{' '}
          <Link to="/cadastro" className="font-medium text-mesa-teal-700 dark:text-mesa-teal-300">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  )
}
