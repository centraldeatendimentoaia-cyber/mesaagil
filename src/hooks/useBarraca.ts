import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { aplicarTema } from '../lib/tema'
import type { Barraca } from '../types/database'

type EstadoBarraca = {
  barraca: Barraca | null
  carregando: boolean
  erro: string | null
}

export function useBarraca(slug: string) {
  const [estado, setEstado] = useState<EstadoBarraca>({
    barraca: null,
    carregando: true,
    erro: null,
  })

  useEffect(() => {
    let cancelado = false
    setEstado({ barraca: null, carregando: true, erro: null })

    supabase
      .from('barracas')
      .select('*')
      .eq('slug', slug)
      .single()
      .then(({ data, error }) => {
        if (cancelado) return

        if (error) {
          setEstado({ barraca: null, carregando: false, erro: error.message })
          return
        }

        const barraca = data as Barraca
        aplicarTema(barraca)
        setEstado({ barraca, carregando: false, erro: null })
      })

    return () => {
      cancelado = true
    }
  }, [slug])

  return estado
}
