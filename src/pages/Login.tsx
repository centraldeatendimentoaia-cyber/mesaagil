import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { AtSign, KeyRound, LogIn, Lock, Mail } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function Login() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
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

    // /assinar redireciona pro login preservando plano/ciclo — depois de
    // logar, volta exatamente pra lá em vez de cair na tela padrão.
    const voltar = params.get('voltar')
    if (voltar) {
      const resto = new URLSearchParams(params)
      resto.delete('voltar')
      navigate(`${voltar}?${resto.toString()}`)
      return
    }

    navigate('/')
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden p-6 [background:var(--mesa-gradient-atmosphere)]">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 -translate-y-1/3 rounded-mesa-full bg-mesa-orange-300/40 blur-3xl dark:bg-mesa-orange-500/25"
        aria-hidden
      />

      <div className="relative w-full max-w-[400px]">
        <div className="flex flex-col items-center text-center">
          <div className="flex size-16 items-center justify-center rounded-mesa-lg border border-mesa-border-subtle bg-mesa-surface p-3 shadow-mesa-1">
            <img
              src="/brand/mesaagil-icone-cor.png"
              alt=""
              className="max-h-full max-w-full object-contain dark:hidden"
            />
            <img
              src="/brand/mesaagil-icone-branco.png"
              alt=""
              className="hidden max-h-full max-w-full object-contain dark:block"
            />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-wide text-mesa-text-primary">
            MESA ÁGIL
          </h1>
          <p className="mt-1 text-sm text-mesa-text-secondary">
            Automação Inteligente para Atendimento
          </p>
        </div>

        <form onSubmit={aoSubmeter} className="mt-8 flex flex-col gap-4">
          <div className="rounded-mesa-lg border border-mesa-border-subtle bg-mesa-surface p-6 shadow-mesa-1">
            <div className="flex flex-col gap-4">
              <div>
                <div className="mb-1.5 flex items-center gap-1.5">
                  <AtSign className="size-3.5 text-mesa-text-secondary" aria-hidden />
                  <label
                    htmlFor="login-email"
                    className="font-mesa-mono text-xs font-semibold uppercase tracking-wider text-mesa-text-secondary"
                  >
                    E-mail
                  </label>
                </div>
                <Input
                  id="login-email"
                  type="email"
                  icon={<Mail aria-hidden />}
                  autoComplete="email"
                  autoFocus
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Lock className="size-3.5 text-mesa-text-secondary" aria-hidden />
                    <label
                      htmlFor="login-senha"
                      className="font-mesa-mono text-xs font-semibold uppercase tracking-wider text-mesa-text-secondary"
                    >
                      Senha de acesso
                    </label>
                  </div>
                  <Link
                    to="/esqueci-senha"
                    className="font-mesa-mono text-xs font-medium text-mesa-teal-700 dark:text-mesa-teal-300"
                  >
                    Esqueci minha senha
                  </Link>
                </div>
                <Input
                  id="login-senha"
                  type="password"
                  icon={<KeyRound aria-hidden />}
                  autoComplete="current-password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
              </div>

              {erro && <p className="text-sm font-medium text-mesa-error-500">{erro}</p>}
            </div>
          </div>

          <Button
            type="submit"
            size="xl"
            icon={<LogIn className="size-5" aria-hidden />}
            loading={entrando}
            className="w-full shadow-[0_12px_28px_-8px_rgba(245,158,11,0.55)]"
          >
            Entrar
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-mesa-text-secondary">
          Não tem conta?{' '}
          <Link
            to={`/cadastro?${params.toString()}`}
            className="font-medium text-mesa-teal-700 dark:text-mesa-teal-300"
          >
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  )
}
