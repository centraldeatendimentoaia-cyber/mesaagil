import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import type { OfertaPublica } from '../types/database'

/** /assinar — ponte entre a LP/o app e o checkout da Kirvano.
 * Sem sessão: manda pro cadastro preservando ?plano=&ciclo=.
 * Com sessão: acha o checkout_url certo via ofertas_publicas() e
 * redireciona pro Kirvano com ?src=<usuario_id> — é assim que o webhook
 * (seção 6 do doc) liga a venda de volta a esta conta. */
export function Assinar() {
  const [params] = useSearchParams()
  const { usuario, carregando } = useAuth()
  const [erro, setErro] = useState<string | null>(null)

  const plano = params.get('plano')
  const ciclo = params.get('ciclo')

  useEffect(() => {
    if (carregando) return

    if (!usuario) {
      const destino = new URLSearchParams({ plano: plano ?? '', ciclo: ciclo ?? '' }).toString()
      window.location.replace(`/cadastro?voltar=/assinar&${destino}`)
      return
    }

    if (!plano || !ciclo) {
      setErro('Plano não informado.')
      return
    }

    let cancelado = false

    supabase
      .rpc('ofertas_publicas')
      .then(({ data, error }) => {
        if (cancelado) return
        if (error) {
          setErro('Não foi possível carregar os planos. Tente de novo em instantes.')
          return
        }

        const oferta = (data as OfertaPublica[] | null)?.find((o) => o.plano === plano && o.ciclo === ciclo)
        if (!oferta) {
          setErro('Essa oferta ainda não está disponível.')
          return
        }

        const url = new URL(oferta.checkout_url)
        url.searchParams.set('src', usuario.id)
        window.location.replace(url.toString())
      })

    return () => {
      cancelado = true
    }
  }, [carregando, usuario, plano, ciclo])

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
      {erro ? (
        <p className="text-sm text-mesa-error-500">{erro}</p>
      ) : (
        <p className="text-mesa-text-secondary">Levando você pro checkout...</p>
      )}
    </div>
  )
}
