import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

const MENSAGENS_ERRO_LOGIN: Record<string, string> = {
  'Invalid login credentials': 'Email ou senha incorretos',
  'Email not confirmed': 'Confirme seu email antes de entrar',
}

function traduzirErroLogin(mensagem: string): string {
  return MENSAGENS_ERRO_LOGIN[mensagem] ?? 'Não foi possível entrar. Tente novamente.'
}

export function useAuth() {
  const [sessao, setSessao] = useState<Session | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let cancelado = false

    supabase.auth.getSession().then(({ data }) => {
      if (cancelado) return
      setSessao(data.session)
      setCarregando(false)
    })

    const { data: assinatura } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      if (cancelado) return
      setSessao(novaSessao)
      setCarregando(false)
    })

    return () => {
      cancelado = true
      assinatura.subscription.unsubscribe()
    }
  }, [])

  async function entrar(email: string, senha: string): Promise<{ erro?: string }> {
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) return { erro: traduzirErroLogin(error.message) }
    return {}
  }

  async function sair(): Promise<void> {
    await supabase.auth.signOut()
  }

  async function resetarSenha(email: string): Promise<void> {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })
  }

  const usuario: User | null = sessao?.user ?? null

  return { sessao, usuario, carregando, entrar, sair, resetarSenha }
}
