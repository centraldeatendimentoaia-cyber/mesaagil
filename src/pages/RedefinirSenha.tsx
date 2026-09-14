import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { KeyRound, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

const ATRASO_REDIRECIONAMENTO_MS = 1500

export function RedefinirSenha() {
  const navigate = useNavigate()

  const [novaSenha, setNovaSenha] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [salvo, setSalvo] = useState(false)

  useEffect(() => {
    if (!salvo) return
    const timeout = window.setTimeout(() => navigate('/'), ATRASO_REDIRECIONAMENTO_MS)
    return () => window.clearTimeout(timeout)
  }, [salvo, navigate])

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
    <div className="flex min-h-screen flex-col items-center justify-center p-6 [background:var(--mesa-gradient-atmosphere)]">
      <div className="w-full max-w-[420px]">
        <div className="flex flex-col items-center text-center">
          <div className="flex size-16 items-center justify-center rounded-mesa-full bg-white shadow-mesa-1 dark:bg-mesa-neutral-800">
            <KeyRound className="size-7 text-mesa-orange-500" aria-hidden />
          </div>
          <h1 className="mt-4 text-[32px] font-bold leading-[40px] text-mesa-text-primary">
            Redefinir senha
          </h1>
          {salvo ? (
            <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-mesa-text-secondary">
              <CheckCircle className="size-4 shrink-0 text-mesa-teal-600" aria-hidden />
              Senha atualizada! Te levando pro MesaAgil...
            </p>
          ) : (
            <p className="mt-1 text-sm text-mesa-text-secondary">Escolha uma senha nova</p>
          )}
        </div>

        {!salvo && (
          <>
            <form onSubmit={aoSubmeter} className="mt-8 flex flex-col gap-4">
              <Input
                label="Nova senha"
                type="password"
                autoComplete="new-password"
                autoFocus
                required
                minLength={6}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
              />

              {erro && <p className="text-sm font-medium text-mesa-error-500">{erro}</p>}

              <Button type="submit" size="xl" loading={salvando} className="w-full">
                Salvar nova senha
              </Button>
            </form>

            <Link
              to="/login"
              className="mt-4 block text-center text-sm font-medium text-mesa-teal-700 dark:text-mesa-teal-300"
            >
              Voltar para o login
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
