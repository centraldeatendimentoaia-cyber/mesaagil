import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
      <div className="w-full max-w-[420px]">
        <div className="flex flex-col items-center text-center">
          <img src="/brand/mesaagil-logo-cor.png" alt="MesaAgil" className="h-12 w-auto dark:hidden" />
          <img
            src="/brand/mesaagil-logo-branco.png"
            alt="MesaAgil"
            className="hidden h-12 w-auto dark:block"
          />
          <p className="mt-3 text-sm text-mesa-text-secondary">
            Automação Inteligente para Atendimento
          </p>
        </div>

        <form onSubmit={aoSubmeter} className="mt-8 flex flex-col gap-4">
          <Input
            label="E-mail"
            type="email"
            autoComplete="email"
            autoFocus
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div>
            <Input
              label="Senha"
              type="password"
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

          <Button type="submit" size="xl" loading={entrando} className="w-full">
            Entrar
          </Button>
        </form>

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
