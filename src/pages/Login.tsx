import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ScanFace } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

const DURACAO_AVISO_FACE_ID_MS = 3000

export function Login() {
  const navigate = useNavigate()
  const { entrar } = useAuth()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [entrando, setEntrando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [avisoFaceId, setAvisoFaceId] = useState(false)
  const avisoFaceIdTimerRef = useRef<number | null>(null)

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

  function aoClicarFaceId() {
    setAvisoFaceId(true)
    if (avisoFaceIdTimerRef.current !== null) window.clearTimeout(avisoFaceIdTimerRef.current)
    avisoFaceIdTimerRef.current = window.setTimeout(() => {
      setAvisoFaceId(false)
    }, DURACAO_AVISO_FACE_ID_MS)
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-6 [background:var(--mesa-gradient-atmosphere)]">
      <div className="w-full max-w-[420px]">
        <div className="flex flex-col items-center text-center">
          <div className="flex size-16 items-center justify-center rounded-mesa-full bg-white shadow-mesa-1 dark:bg-mesa-neutral-800">
            <span className="text-xl font-bold text-mesa-orange-500">MA</span>
          </div>
          <h1 className="mt-4 text-[32px] font-bold leading-[40px] text-mesa-text-primary">
            MesaAgil
          </h1>
          <p className="mt-1 text-sm text-mesa-text-secondary">
            by AIA · Automação Inteligente para Atendimento
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

        <div className="mt-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-mesa-border-subtle" />
          <span className="text-sm text-mesa-text-secondary">ou</span>
          <span className="h-px flex-1 bg-mesa-border-subtle" />
        </div>

        <Button
          variant="outline"
          size="lg"
          icon={<ScanFace className="size-5" aria-hidden />}
          className="mt-6 w-full"
          onClick={aoClicarFaceId}
        >
          Entrar com Face ID
        </Button>
        <p
          role="status"
          className="mt-2 text-center text-xs text-mesa-text-secondary"
        >
          {avisoFaceId ? 'Em breve' : ' '}
        </p>

        <p className="mt-4 text-center text-xs text-mesa-text-secondary">
          Acesso restrito aos donos e operadores cadastrados
        </p>
      </div>
    </div>
  )
}
