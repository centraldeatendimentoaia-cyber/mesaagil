import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { aplicarTema } from '../lib/tema'
import type { Barraca } from '../types/database'

type EstadoBarraca = {
  barraca: Barraca | null
  carregando: boolean
  erro: string | null
}

function chaveCache(slug: string): string {
  return `mesaagil:barraca:${slug}`
}

function lerBarracaCache(slug: string): Barraca | null {
  try {
    const bruto = window.localStorage.getItem(chaveCache(slug))
    return bruto ? (JSON.parse(bruto) as Barraca) : null
  } catch {
    return null
  }
}

function salvarBarracaCache(slug: string, barraca: Barraca): void {
  try {
    window.localStorage.setItem(chaveCache(slug), JSON.stringify(barraca))
  } catch {
    // localStorage indisponível (modo privado, quota etc.) — só não cacheia
  }
}

export function useBarraca(slug: string) {
  const [estado, setEstado] = useState<EstadoBarraca>({
    barraca: null,
    carregando: true,
    erro: null,
  })

  useEffect(() => {
    let cancelado = false

    // Mostra a última barraca conhecida na hora (sem esperar rede) e
    // deixa a busca de verdade confirmar/atualizar em segundo plano.
    // Isso é o que faz o app instalado abrir de imediato mesmo sem
    // conexão — sem cache, ele ficaria preso em "Carregando..." pra
    // sempre no primeiro load offline.
    const cache = lerBarracaCache(slug)
    if (cache) {
      aplicarTema(cache)
      setEstado({ barraca: cache, carregando: false, erro: null })
    } else {
      setEstado({ barraca: null, carregando: true, erro: null })
    }

    supabase
      .from('barracas')
      .select('*')
      .eq('slug', slug)
      .single()
      .then(({ data, error }) => {
        if (cancelado) return

        if (error) {
          // já tem cache na tela — provavelmente é só falta de rede,
          // não vale a pena substituir o que já está funcionando por um erro
          if (cache) return
          setEstado({ barraca: null, carregando: false, erro: error.message })
          return
        }

        const barraca = data as Barraca
        aplicarTema(barraca)
        salvarBarracaCache(slug, barraca)
        setEstado({ barraca, carregando: false, erro: null })
      })

    return () => {
      cancelado = true
    }
  }, [slug])

  return estado
}
