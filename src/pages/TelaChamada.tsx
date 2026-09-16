import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import clsx from 'clsx'
import { useBarracaAtual } from '../layouts/contextoBarraca'
import { usePedidosAtual } from '../layouts/contextoPedidos'

const OPACIDADES_ANTERIORES = [0.7, 0.5, 0.3]

function formatarSenha(senha: number): string {
  return String(senha).padStart(3, '0')
}

export function TelaChamada() {
  const barraca = useBarracaAtual()
  const navigate = useNavigate()
  const { pedidos } = usePedidosAtual()

  const pedidosProntos = useMemo(
    () =>
      pedidos
        .filter((p) => p.status === 'pronto')
        .sort((a, b) => {
          const tempoA = a.pronto_em ? new Date(a.pronto_em).getTime() : 0
          const tempoB = b.pronto_em ? new Date(b.pronto_em).getTime() : 0
          return tempoB - tempoA
        }),
    [pedidos],
  )

  const hero = pedidosProntos[0] ?? null
  const anteriores = pedidosProntos.slice(1, 4)

  // Fade simples (250ms) quando a senha em destaque muda — ajuste durante o
  // render (não em efeito) para não brigar com react-hooks/set-state-in-effect;
  // o próprio useEffect só reagenda o frame que volta a opacidade a 1.
  const [prevHeroId, setPrevHeroId] = useState(hero?.id ?? null)
  const [visivel, setVisivel] = useState(true)

  if ((hero?.id ?? null) !== prevHeroId) {
    setPrevHeroId(hero?.id ?? null)
    setVisivel(false)
  }

  useEffect(() => {
    if (visivel) return
    const raf = requestAnimationFrame(() => setVisivel(true))
    return () => cancelAnimationFrame(raf)
  }, [visivel])

  return (
    <div className="relative flex min-h-screen flex-col bg-mesa-neutral-900 px-6 pt-[calc(env(safe-area-inset-top)+16px)] pb-[calc(env(safe-area-inset-bottom)+24px)]">
      <button
        type="button"
        onClick={() => navigate(`/${barraca.slug}`)}
        aria-label="Sair da tela de chamada"
        className="absolute right-3 top-3 z-10 flex size-11 items-center justify-center text-mesa-neutral-400 opacity-40 outline-none transition-opacity duration-[var(--mesa-duration-micro)] hover:opacity-70 focus-visible:opacity-70"
      >
        <X className="size-5" aria-hidden />
      </button>

      <div className="flex justify-center pt-2">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-mesa-orange-500">
          {barraca.nome}
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        {hero ? (
          <>
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-mesa-neutral-500">
              Senha
            </span>
            <span
              aria-live="polite"
              className={clsx(
                'text-[96px] font-bold leading-[104px] tracking-tight text-white',
                'transition-opacity duration-[250ms]',
                visivel ? 'opacity-100' : 'opacity-0',
              )}
            >
              {formatarSenha(hero.senha)}
            </span>
            {hero.viagem && (
              <span className="text-xs font-bold tracking-widest text-mesa-neutral-400">
                VIAGEM
              </span>
            )}
            <span className="mt-2 inline-flex items-center gap-2 rounded-mesa-full bg-mesa-orange-500/15 px-4 py-2 text-sm font-semibold text-mesa-orange-500">
              <Check className="size-4 shrink-0" aria-hidden />
              Pedido pronto — retire no balcão
            </span>
          </>
        ) : (
          <p className="text-3xl font-medium text-mesa-neutral-600">Aguardando pedidos...</p>
        )}
      </div>

      {anteriores.length > 0 && (
        <div className="flex flex-col items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-mesa-neutral-500">
            Chamadas anteriores
          </span>
          <div className="flex items-center gap-6">
            {anteriores.map((pedido, indice) => (
              <span
                key={pedido.id}
                className="text-2xl font-bold text-white"
                style={{ opacity: OPACIDADES_ANTERIORES[indice] }}
              >
                {formatarSenha(pedido.senha)}
              </span>
            ))}
          </div>
        </div>
      )}

      {barraca.logo_url && (
        <div className="flex justify-center pt-6">
          <img
            src={barraca.logo_url}
            alt=""
            className="size-8 rounded-mesa-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
      )}
    </div>
  )
}
