import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Barraca } from '../types/database'

export type BarracaComPapel = {
  barraca_id: string
  papel: string
  barraca: Barraca
}

// Cache em memória do módulo — sobrevive a remounts (Dispatcher, RotaProtegida
// e SelecionarBarraca todos chamam esse hook) sem precisar refetch, e é
// automaticamente invalidado quando o usuario_id muda (troca de conta).
let cache: { usuarioId: string; barracas: BarracaComPapel[] } | null = null

export function useBarracasDoUsuario(usuario: User | null) {
  const [barracas, setBarracas] = useState<BarracaComPapel[]>(() => {
    if (usuario && cache?.usuarioId === usuario.id) return cache.barracas
    return []
  })
  const [carregando, setCarregando] = useState(() => {
    if (!usuario) return false
    return cache?.usuarioId !== usuario.id
  })
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!usuario) {
      setBarracas([])
      setCarregando(false)
      setErro(null)
      return
    }

    if (cache?.usuarioId === usuario.id) {
      setBarracas(cache.barracas)
      setCarregando(false)
      setErro(null)
      return
    }

    let cancelado = false
    setCarregando(true)
    setErro(null)

    supabase
      .from('usuarios_barracas')
      .select('barraca_id, papel, barracas(id, nome, slug, logo_url, cor_primaria, modo, verde_ate, amarelo_ate, criada_em)')
      .eq('usuario_id', usuario.id)
      .then(({ data, error }) => {
        if (cancelado) return

        if (error) {
          setErro(error.message)
          setCarregando(false)
          return
        }

        const resultado = (data ?? []).map((linha) => ({
          barraca_id: linha.barraca_id as string,
          papel: linha.papel as string,
          barraca: linha.barracas as unknown as Barraca,
        }))

        cache = { usuarioId: usuario.id, barracas: resultado }
        setBarracas(resultado)
        setCarregando(false)
      })

    return () => {
      cancelado = true
    }
  }, [usuario])

  return { barracas, carregando, erro }
}
