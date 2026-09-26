import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { AssinaturaBarraca } from '../types/database'

type EstadoAssinatura = {
  assinatura: AssinaturaBarraca | null
  carregando: boolean
  erro: string | null
}

function chaveCache(slug: string): string {
  return `mesaagil:assinatura:${slug}`
}

function lerCache(slug: string): AssinaturaBarraca | null {
  try {
    const bruto = window.localStorage.getItem(chaveCache(slug))
    return bruto ? (JSON.parse(bruto) as AssinaturaBarraca) : null
  } catch {
    return null
  }
}

function salvarCache(slug: string, assinatura: AssinaturaBarraca): void {
  try {
    window.localStorage.setItem(chaveCache(slug), JSON.stringify(assinatura))
  } catch {
    // localStorage indisponível — só não cacheia
  }
}

/** Status da assinatura de quem é DONO da barraca (não de quem está
 * logado — um funcionário é liberado/bloqueado pelo status do dono).
 * Mesmo padrão de cache-first do useBarraca: mostra o último status
 * conhecido na hora (não trava a tela esperando rede) e atualiza em
 * segundo plano assim que a busca de verdade volta. */
export function useAssinaturaBarraca(slug: string) {
  const [estado, setEstado] = useState<EstadoAssinatura>({
    assinatura: null,
    carregando: true,
    erro: null,
  })

  useEffect(() => {
    if (!slug) return

    let cancelado = false

    const cache = lerCache(slug)
    if (cache) {
      setEstado({ assinatura: cache, carregando: false, erro: null })
    } else {
      setEstado({ assinatura: null, carregando: true, erro: null })
    }

    supabase
      .rpc('assinatura_da_barraca', { p_slug: slug })
      .single()
      .then(({ data, error }) => {
        if (cancelado) return

        if (error) {
          if (cache) return
          setEstado({ assinatura: null, carregando: false, erro: error.message })
          return
        }

        const assinatura = data as AssinaturaBarraca
        salvarCache(slug, assinatura)
        setEstado({ assinatura, carregando: false, erro: null })
      })

    return () => {
      cancelado = true
    }
  }, [slug])

  return estado
}
