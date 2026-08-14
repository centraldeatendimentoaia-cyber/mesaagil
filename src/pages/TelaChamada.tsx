import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { useBarracaAtual } from '../layouts/contextoBarraca'
import { useRealtimePedidos } from '../hooks/useRealtimePedidos'

const DURACAO_DESTAQUE_MS = 10000

function tamanhoGrade(quantidade: number): { colunas: string; texto: string } {
  if (quantidade <= 1) return { colunas: 'grid-cols-1', texto: 'text-[260px]' }
  if (quantidade === 2) return { colunas: 'grid-cols-2', texto: 'text-[200px]' }
  if (quantidade <= 4) return { colunas: 'grid-cols-2', texto: 'text-[160px]' }
  if (quantidade <= 6) return { colunas: 'grid-cols-3', texto: 'text-[120px]' }
  if (quantidade <= 9) return { colunas: 'grid-cols-3', texto: 'text-[90px]' }
  return { colunas: 'grid-cols-4', texto: 'text-[72px]' }
}

export function TelaChamada() {
  const barraca = useBarracaAtual()
  const navigate = useNavigate()
  const { pedidos } = useRealtimePedidos(barraca.id)
  const [destacados, setDestacados] = useState<Set<string>>(new Set())

  const vistosRef = useRef<Set<string>>(new Set())
  const timersRef = useRef<Map<string, number>>(new Map())

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

  useEffect(() => {
    const idsAtuais = new Set(pedidosProntos.map((p) => p.id))

    for (const id of vistosRef.current) {
      if (!idsAtuais.has(id)) vistosRef.current.delete(id)
    }

    for (const pedido of pedidosProntos) {
      if (!vistosRef.current.has(pedido.id)) {
        vistosRef.current.add(pedido.id)
        setDestacados((atual) => new Set(atual).add(pedido.id))

        const timer = window.setTimeout(() => {
          setDestacados((atual) => {
            const copia = new Set(atual)
            copia.delete(pedido.id)
            return copia
          })
          timersRef.current.delete(pedido.id)
        }, DURACAO_DESTAQUE_MS)

        timersRef.current.set(pedido.id, timer)
      }
    }
  }, [pedidosProntos])

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
      timers.clear()
    }
  }, [])

  const { colunas, texto } = tamanhoGrade(pedidosProntos.length)

  return (
    <div className="relative flex min-h-screen flex-col bg-cozinha-fundo">
      <button
        type="button"
        onClick={() => navigate(`/${barraca.slug}`)}
        aria-label="Sair da tela de chamada"
        className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full">
          <X size={20} className="text-neutral-400/40" />
        </span>
      </button>

      <header className="flex items-center gap-3 border-b border-white/10 px-6 py-4">
        {barraca.logo_url && (
          <img
            src={barraca.logo_url}
            alt=""
            className="h-8 w-8 rounded-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        )}
        <span className="text-lg font-semibold text-marca">{barraca.nome}</span>
      </header>

      {pedidosProntos.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-3xl font-medium text-neutral-600">Aguardando pedidos...</p>
        </div>
      ) : (
        <div className={`grid flex-1 ${colunas} auto-rows-fr gap-6 p-6`}>
          {pedidosProntos.map((pedido) => {
            const destacado = destacados.has(pedido.id)
            return (
              <div
                key={pedido.id}
                className={`flex flex-col items-center justify-center rounded-3xl border-4 border-sinal-pronto transition-colors duration-1000 ${
                  destacado ? 'bg-neutral-700' : 'bg-neutral-900'
                }`}
              >
                <span className={`font-black leading-none text-white ${texto}`}>
                  {pedido.senha}
                </span>
                {pedido.viagem && (
                  <span className="mt-4 text-2xl font-bold tracking-widest text-neutral-300">
                    VIAGEM
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
