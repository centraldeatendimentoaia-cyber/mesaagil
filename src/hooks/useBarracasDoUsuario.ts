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

async function buscarBarracasDoUsuario(usuarioId: string): Promise<{
  barracas: BarracaComPapel[]
  erro: string | null
}> {
  const { data, error } = await supabase
    .from('usuarios_barracas')
    .select('barraca_id, papel, barracas(id, nome, slug, logo_url, modo, verde_ate, amarelo_ate, criada_em)')
    .eq('usuario_id', usuarioId)

  if (error) return { barracas: [], erro: error.message }

  const resultado = (data ?? []).map((linha) => ({
    barraca_id: linha.barraca_id as string,
    papel: linha.papel as string,
    barraca: linha.barracas as unknown as Barraca,
  }))

  return { barracas: resultado, erro: null }
}

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

    buscarBarracasDoUsuario(usuario.id).then(({ barracas: resultado, erro: erroBusca }) => {
      if (cancelado) return

      if (erroBusca) {
        setErro(erroBusca)
        setCarregando(false)
        return
      }

      cache = { usuarioId: usuario.id, barracas: resultado }
      setBarracas(resultado)
      setCarregando(false)
    })

    return () => {
      cancelado = true
    }
  }, [usuario])

  /** Refaz a busca ignorando o cache — usa depois de criar uma barraca nova,
   * pra ela aparecer na lista sem precisar recarregar a página. */
  async function recarregar() {
    if (!usuario) return
    setCarregando(true)
    const { barracas: resultado, erro: erroBusca } = await buscarBarracasDoUsuario(usuario.id)
    if (erroBusca) {
      setErro(erroBusca)
      setCarregando(false)
      return
    }
    cache = { usuarioId: usuario.id, barracas: resultado }
    setBarracas(resultado)
    setErro(null)
    setCarregando(false)
  }

  return { barracas, carregando, erro, recarregar }
}
