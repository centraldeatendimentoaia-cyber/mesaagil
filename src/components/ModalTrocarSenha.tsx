import { useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { REQUISITOS_SENHA, validarSenhaForte } from '../lib/senha'

const MENSAGENS_ERRO_ATUALIZAR: Record<string, string> = {
  'New password should be different from the old password.':
    'A nova senha precisa ser diferente da atual.',
}

function traduzirErroAtualizar(mensagem: string): string {
  return MENSAGENS_ERRO_ATUALIZAR[mensagem] ?? 'Não foi possível trocar a senha. Tente novamente.'
}

function CampoSenha({
  label,
  valor,
  onMudar,
  autoComplete,
  autoFocus,
}: {
  label: string
  valor: string
  onMudar: (valor: string) => void
  autoComplete: string
  autoFocus?: boolean
}) {
  const [visivel, setVisivel] = useState(false)

  return (
    <label className="mt-4 block">
      <span className="text-sm text-neutral-600 dark:text-neutral-400">{label}</span>
      <div className="mt-1 flex h-11 items-center rounded-2xl border border-neutral-300 pl-3 dark:border-neutral-700">
        <input
          type={visivel ? 'text' : 'password'}
          value={valor}
          onChange={(e) => onMudar(e.target.value)}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          className="h-11 min-w-0 flex-1 bg-transparent text-base text-neutral-900 dark:text-neutral-100"
        />
        <button
          type="button"
          onClick={() => setVisivel((v) => !v)}
          aria-label={visivel ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
          className="flex h-11 w-11 shrink-0 items-center justify-center text-neutral-400"
        >
          {visivel ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </label>
  )
}

export function ModalTrocarSenha({
  email,
  onFechar,
  onSucesso,
}: {
  email: string
  onFechar: () => void
  onSucesso: () => void
}) {
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape') onFechar()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [onFechar])

  const { valida: novaSenhaValida } = validarSenhaForte(novaSenha)
  const mostraDivergencia = confirmarSenha.length > 0 && confirmarSenha !== novaSenha

  const podeTrocar =
    novaSenhaValida && confirmarSenha === novaSenha && senhaAtual.length > 0 && !processando

  async function trocarSenha() {
    if (!podeTrocar) return
    setProcessando(true)
    setErro(null)

    // reautentica com a senha atual antes de trocar — supabase-js so troca a
    // sessao ativa por uma nova (mesmo usuario, tokens renovados) quando o
    // login da certo; se der errado, nao mexe na sessao existente. Validado
    // via Playwright na etapa de testes, nao so por inspecao de codigo.
    const { error: erroLogin } = await supabase.auth.signInWithPassword({
      email,
      password: senhaAtual,
    })

    if (erroLogin) {
      setErro('Senha atual incorreta')
      setProcessando(false)
      return
    }

    const { error: erroUpdate } = await supabase.auth.updateUser({ password: novaSenha })

    if (erroUpdate) {
      setErro(traduzirErroAtualizar(erroUpdate.message))
      setProcessando(false)
      return
    }

    setProcessando(false)
    onSucesso()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
      onClick={onFechar}
    >
      <div
        className="w-full max-w-[420px] rounded-2xl bg-white p-6 dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Trocar senha
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Digite sua senha atual e escolha uma nova segura.
        </p>

        <CampoSenha
          label="Senha atual"
          valor={senhaAtual}
          onMudar={setSenhaAtual}
          autoComplete="current-password"
          autoFocus
        />

        <CampoSenha
          label="Nova senha"
          valor={novaSenha}
          onMudar={setNovaSenha}
          autoComplete="new-password"
        />

        <ul className="mt-2 flex flex-col gap-1">
          {REQUISITOS_SENHA.map((requisito) => {
            const atendido = requisito.testar(novaSenha)
            return (
              <li
                key={requisito.chave}
                className={`flex items-center gap-1.5 text-xs ${
                  atendido ? 'text-sinal-verde' : 'text-neutral-400 dark:text-neutral-500'
                }`}
              >
                <span aria-hidden>{atendido ? '✓' : '✗'}</span>
                {requisito.label}
              </li>
            )
          })}
        </ul>

        <CampoSenha
          label="Confirmar nova senha"
          valor={confirmarSenha}
          onMudar={setConfirmarSenha}
          autoComplete="new-password"
        />
        {mostraDivergencia && (
          <p className="mt-1 text-xs font-medium text-sinal-vermelho">As senhas não conferem</p>
        )}

        {erro && <p className="mt-4 text-sm font-medium text-sinal-vermelho">{erro}</p>}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onFechar}
            className="min-h-11 flex-1 rounded-2xl bg-neutral-200 text-base font-medium text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={trocarSenha}
            disabled={!podeTrocar}
            className="min-h-11 flex-1 rounded-2xl bg-marca text-base font-semibold text-marca-texto disabled:opacity-40"
          >
            {processando ? 'Trocando...' : 'Trocar senha'}
          </button>
        </div>
      </div>
    </div>
  )
}
